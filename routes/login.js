import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connectDB from '../mongodbConnection.js';

dotenv.config();  // Load environment variables

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // Use secret from .env

router.post('/', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const usersCollection = database.collection('Users');

        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // Find user by username
        const user = await usersCollection.findOne({ name });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful!", token, role: user.role , name:user.name});

        await client.close();
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

export default router;
