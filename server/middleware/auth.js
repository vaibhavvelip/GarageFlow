const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'garageflow_super_secret_jwt_key_2026_key';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. Authentication token required.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role, name }
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
    }
}

// Middleware to check role authorization
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole,
    JWT_SECRET
};
