export function isAdmin(req, res, next) {
    const role = req.headers['x-user-role']; // Read role from custom header

    if (!role) {
        return res.status(403).json({ message: 'Access denied. No role provided.' });
    }

    if (role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next(); // Proceed to next middleware/route
}
