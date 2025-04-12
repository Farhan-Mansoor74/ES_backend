import express from 'express';
import connectDB from '../mongodbConnection.js';
import { isAdmin } from '../middleware/authAdmin.js';
import multer from 'multer';
import XLSX from 'xlsx';
import { ObjectId } from 'mongodb';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin authentication middleware (only allows admins)
router.use(isAdmin);

// Route to fetch all orders for the admin dashboard
router.get('/orders', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const ordersCollection = database.collection('Orders');

        const orders = await ordersCollection.find().toArray();

        res.status(200).json(orders);
        await client.close();
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to get all stores
router.get('/all-stores', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Stores');

        // Fetch all stores
        const stores = await storesCollection.find().toArray();
        res.status(200).json(stores);

        await client.close();
    } catch (error) {
        console.error("Error fetching stores:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

router.post('/add-store', async (req, res) => {
    const { name, address, city, country, phone } = req.body;

    if (!name || !address || !city || !country) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Stores');

        const result = await storesCollection.insertOne({
            name,
            address,
            city,
            country,
            phone: phone || '',
            createdAt: new Date()
        });

        res.status(201).json({ message: "Store added successfully", storeId: result.insertedId });

        await client.close();
    } catch (error) {
        console.error("Error adding store:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/add-product', async (req, res) => {
    const { store_id, name, price, category, availableInventory, image } = req.body;

    if (!store_id || !name || !price || !category || !availableInventory || !image) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Products');

        const result = await storesCollection.insertOne({
            store_id,
            name,
            price,
            category,
            availableInventory,
            image
        });

        res.status(201).json({ message: "Product added successfully", storeId: result.insertedId });

        await client.close();
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to handle Excel file upload
router.post('/products/upload', upload.single('file'), async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const productsCollection = database.collection('Products');

        // Get default store ID if provided
        const defaultStoreId = req.body.store_id;

        // Read Excel file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const products = XLSX.utils.sheet_to_json(worksheet);

        // Process each product
        for (let product of products) {
            // Use default store ID if not provided in Excel
            if (!product.store_id && defaultStoreId) {
                product.store_id = defaultStoreId;
            }

            // Validate required fields
            if (!product.store_id || !product.name || !product.price) {
                continue; // Skip invalid entries
            }

            // Convert price to number if it's not already
            if (typeof product.price === 'string') {
                product.price = parseFloat(product.price);
            }

            if (typeof product.availableInventory === 'string') {
                product.availableInventory = parseInt(product.availableInventory, 10);
            }
        }

        // Filter out invalid products
        const validProducts = products.filter(p => p.store_id && p.name && p.price);

        // Insert valid products
        if (validProducts.length > 0) {
            await productsCollection.insertMany(validProducts);
        }

        await client.close();
        res.status(200).json({
            message: "Products imported successfully",
            added: validProducts.length,
            total: products.length
        });
    } catch (error) {
        console.error("Error uploading products:", error);
        res.status(500).json({ message: "Error uploading products", error: error.toString() });
    }
});

router.put('/updateStore/:storeId', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Stores');
        const { storeId } = req.params;

        // First, find the store to verify it exists and get its current data
        const existingStore = await storesCollection.findOne({ _id: new ObjectId(storeId) });

        if (!existingStore) {
            await client.close();
            return res.status(404).json({ message: "Store not found" });
        }

        // Get the updated data, excluding _id if it's in the request body
        const { _id, ...updatedFields } = req.body;

        // Perform the update
        const result = await storesCollection.updateOne(
            { _id: new ObjectId(storeId) },
            { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
            await client.close();
            return res.status(404).json({ message: "Store not found or not updated" });
        }

        // Fetch the updated store to return in the response
        const updatedStore = await storesCollection.findOne({ _id: new ObjectId(storeId) });

        res.status(200).json(updatedStore);
        await client.close();
    } catch (error) {
        console.error("Error updating store:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Route to delete a store by ID
router.delete('/delete/:storeId', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Stores');
        const { storeId } = req.params;

        const result = await storesCollection.deleteOne({ _id: new ObjectId(storeId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Store not found" });
        }

        res.status(200).json({ message: "Store deleted successfully" });
        await client.close();
    } catch (error) {
        console.error("Error deleting store:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Route to delete a product by ID
router.delete('/products/delete/:productId', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Products');
        const { productId } = req.params;

        const result = await storesCollection.deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Store not found" });
        }

        res.status(200).json({ message: "Store deleted successfully" });
        await client.close();
    } catch (error) {
        console.error("Error deleting store:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

router.get('/get-admins', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');

        const admins = await usersCollection.find({ role: 'admin' }).toArray();
        res.status(200).json(admins);

        await client.close();
    } catch (error) {
        console.error("Error fetching admin users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/addUser', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const result = await usersCollection.insertOne({
            name,
            email,
            password, // You can hash this before saving
            role,
            createdAt: new Date()
        });

        res.status(201).json({ message: "User created successfully", userId: result.insertedId });

        await client.close();
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Validate the userId format
        if (!userId || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
        await client.close();
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');

        const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
        await client.close();
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put('/users/:id', async (req, res) => {
    const { name, email, role } = req.body;

    try {
        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { name, email, role } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully" });
        await client.close();
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to count total users
router.get('/user/count', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');

        const userCount = await usersCollection.countDocuments();

        res.status(200).json({ count: userCount });

        await client.close();
    } catch (error) {
        console.error("Error counting users:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});


export default router;
