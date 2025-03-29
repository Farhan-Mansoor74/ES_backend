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

// Route to search products in mongodb
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query; // Getting search query from request parameters
        
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const { client, database } = await connectDB();
        const productsCollection = database.collection('Products');

        // Create a case-insensitive regular expression for searching
        const searchRegex = new RegExp(query, 'i');

        // Use $or to search in either the 'subject' or 'location' field
        const searchResults = await productsCollection.find({
            $or: [
                { subject: searchRegex }, 
                { location: searchRegex }  
            ]
        }).toArray();

        await client.close();

        if (searchResults.length === 0) {
            return res.status(404).json({ 
                message: "No products found matching your search",
                results: [] 
            });
        }

        console.log("Search results found:", searchResults);

        // Sends sea
        res.status(200).json(searchResults);

    } catch (error) {
        console.error("Error performing search:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
