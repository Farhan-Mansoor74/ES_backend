import express from 'express';
import connectDB from '../mongodbConnection.js';
import { isAdmin } from './auth.js';

const router = express.Router();

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

export default router;
