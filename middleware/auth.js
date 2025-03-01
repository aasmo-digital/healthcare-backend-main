const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded); // Debugging

        req.user = decoded;

        if (!req.user.id) {
            return res.status(400).json({ message: 'Invalid token structure. User ID missing.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }
    next();
};

// Middleware to check if the user is a doctor
const isDoctor = (req, res, next) => {
    console.log("User Data in Request:", req.user); // Debugging
    if (!req.user || req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Access denied. You are not a doctor.' });
    }
    next();
};

module.exports = { authenticate, isAdmin, isDoctor }