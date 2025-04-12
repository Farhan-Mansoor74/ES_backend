import jwt from 'jsonwebtoken';

export function authenticateUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // use your actual secret
        req.user = decoded; // Attach user to request
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};