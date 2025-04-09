import express from 'express';
import connectDB from '../mongodbConnection.js';
import { ObjectId } from 'mongodb';

// Create new router instance
const router = express.Router();

// Route to add an order (when user submits order)
router.post('/', async (req, res) => {
    console.log('Received order request body:', req.body);
    try {
        const { client, database } = await connectDB();
        const ordersCollection = database.collection('Orders');
        const { name, phone, cart, address, total } = req.body;
        
        // Validate cart items have quantities
        if (!cart.every(item => item.hasOwnProperty('quantity'))) {
            res.status(400).json({
                message: 'Invalid cart data: each item must have a quantity'
            });
            return;
        }

        // Create new order with quantity information
        const newOrder = {
            name,
            phone,
            address,
            cart: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            total,
            createdAt: new Date(),
        };

        // Add order to orders collection
        const result = await ordersCollection.insertOne(newOrder);
        console.log("Order placed successfully", newOrder);
        console.log("Inserted order ID:", result.insertedId);

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: result.insertedId
        });

        await client.close();
    } catch (error) {
        console.error("Complete error placing order:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.toString()
        });
    }
});

// Router to update product availability after user submits an order
router.put('/:productId', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const productsCollection = database.collection('Products');
        const { productId } = req.params;
        const { quantity = 1 } = req.body; // Default to 1 if not provided

        // First get the current product to check inventory
        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
        
        if (!product) {
            console.log("No product found with ID:", productId);
            res.status(404).json({ message: "product not found" });
            return;
        }

        // Calculate new inventory
        const newInventory = product.availableInventory - quantity;
        
        // Validate inventory won't go negative
        if (newInventory < 0) {
            res.status(400).json({ 
                message: "Not enough inventory available",
                availableInventory: product.availableInventory
            });
            return;
        }

        console.log('Updating product:', {
            productId,
            currentInventory: product.availableInventory,
            quantityToReduce: quantity,
            newInventory: newInventory
        });

        // Updates available inventory to new inventory
        const result = await productsCollection.updateOne(
            { _id: new ObjectId(productId) },
            { $set: { availableInventory: newInventory } }
        );

        console.log('Update result:', {
            matchedCount: result.matchedCount, //Indicates the number of documents that matched the filter criteria.
            modifiedCount: result.modifiedCount //Indicates the number of documents that were modified by the update operation.
        });

        console.log("Product availability updated:", productId);
        res.status(200).json({ 
            message: "Availability updated successfully",
            newAvailability: newInventory
        });

        await client.close();
    } catch (error) {
        console.error("Error updating product availability:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;