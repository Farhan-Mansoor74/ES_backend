import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
    try {
        // Since JWT is stored client-side, there's no real "logout" on the server.
        // Simply instruct the client to remove the token.
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
