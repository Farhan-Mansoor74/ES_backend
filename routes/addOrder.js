import express from 'express';
import connectDB from '../mongodbConnection.js';

// Create new router instance
const router = express.Router();

// Route to add an order (when user submits order)
router.post('/', async (req, res) => {
    console.log('Received order request body:', req.body);
    try {
        const { client, database } = await connectDB();
        const ordersCollection = database.collection('Orders');
        const { name, phone, cart, total } = req.body;
        
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
            cart: cart.map(item => ({
                id: item.id,
                subject: item.subject,
                fee: item.fee,
                quantity: item.quantity,
                subtotal: item.fee * item.quantity
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

export default router;