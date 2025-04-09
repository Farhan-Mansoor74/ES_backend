import express from 'express';
import { ObjectId } from 'mongodb';
import connectDB from '../mongodbConnection.js';

const router = express.Router();

// Route to get all stores
router.get('/', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Stores');

        const stores = await storesCollection.find().toArray();
        res.status(200).json(stores);

        await client.close();
    } catch (error) {
        console.error("Error fetching stores:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

// Route to get a single store by ID
router.get('/:storeId', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const storesCollection = database.collection('Stores');
        const { storeId } = req.params;

        const store = await storesCollection.findOne({ _id: new ObjectId(storeId) });

        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        res.status(200).json(store);
        await client.close();
    } catch (error) {
        console.error("Error fetching store:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

export default router;