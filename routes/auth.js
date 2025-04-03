export function isAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8')); // Simple decoding (replace with JWT in production)

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(400).json({ message: 'Invalid token.' });
    }
}
