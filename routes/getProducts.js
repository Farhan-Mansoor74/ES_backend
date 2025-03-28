import express from 'express';
import connectDB from '../mongodbConnection.js';

const router = express.Router();

// Route to get all products
router.get('/', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const productsCollection = database.collection('Products');

        // Fetch all products
        const products = await productsCollection.find().toArray();
        res.status(200).json(products);

        await client.close();
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Route to get products of a single store
router.get('/:storeId', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const productsCollection = database.collection('Products');
        const { storeId } = req.params;

        // Fetch products belonging to the specified store
        const products = await productsCollection.find({ storeId }).toArray();
        res.status(200).json(products);

        await client.close();
    } catch (error) {
        console.error(`Error fetching products for store ${req.params.storeId}:`, error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

export default router;
