const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const authService = require('../services/insforge/authService');
const idMapper = require('../services/insforge/idMapper');

// Register new customer account
async function register(req, res) {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'All fields (name, email, phone, password) are required.' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format.' });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        try {
            // Authoritative path: InsForge Auth
            const authResult = await authService.registerUser({
                email,
                password,
                name,
                phone,
                role: 'CUSTOMER'
            });

            const newUser = authResult.user;

            const token = jwt.sign(
                { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(201).json({
                success: true,
                message: 'Customer account registered successfully.',
                token,
                user: newUser
            });
        } catch (insforgeErr) {
            console.error('[AuthController] InsForge register error:', insforgeErr.message);
            if (insforgeErr.message && (insforgeErr.message.toLowerCase().includes('already') || insforgeErr.message.toLowerCase().includes('duplicate') || insforgeErr.message.toLowerCase().includes('exists'))) {
                return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
            }
            return res.status(500).json({ success: false, message: insforgeErr.message || 'Database error during registration.' });
        }
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
    }
}

// User login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        try {
            const authResult = await authService.loginUser({ email, password });
            if (authResult && authResult.user) {
                const token = jwt.sign(
                    { id: authResult.user.id, email: authResult.user.email, name: authResult.user.name, role: authResult.user.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    message: 'Logged in successfully.',
                    token,
                    user: authResult.user
                });
            }
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        } catch (insforgeErr) {
            console.warn('[AuthController] InsForge login error:', insforgeErr.message);
            if (insforgeErr.message && (insforgeErr.message.toLowerCase().includes('invalid') || insforgeErr.message.toLowerCase().includes('password') || insforgeErr.message.toLowerCase().includes('not found') || insforgeErr.message.toLowerCase().includes('credentials'))) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }
            return res.status(500).json({ success: false, message: insforgeErr.message || 'Database error during login.' });
        }
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
}

// Get user profile
async function getProfile(req, res) {
    try {
        const resolvedUid = idMapper.resolveUserId(req.user.id);
        const profile = await authService.getUserProfile(resolvedUid);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'User profile not found.' });
        }
        return res.json({ success: true, user: profile });
    } catch (err) {
        console.error('Profile Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve profile.' });
    }
}

// Update profile
async function updateProfile(req, res) {
    try {
        const { name, phone, password } = req.body;
        const resolvedUid = idMapper.resolveUserId(req.user.id);

        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Name and phone are required.' });
        }

        if (password && password.trim().length > 0 && password.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        await authService.updateUserProfile(resolvedUid, { name, phone });
        return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Update Profile Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to update profile.' });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};
