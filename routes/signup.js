import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '../mongodbConnection.js';

const router = express.Router();

// User Signup Route
router.post('/', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');

        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role || "customer", // Default to "customer" if not specified
            preferences: role === "customer" ? [] : undefined,
            saved_stores: role === "customer" ? [] : undefined,
        };

        const result = await usersCollection.insertOne(newUser);

        res.status(201).json({ message: "User registered successfully!", userId: result.insertedId });

        await client.close();
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

export default router;
