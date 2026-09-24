const express = require('express');
const router = express.Router();
const { insforgeAdmin } = require('../services/insforge/client');

router.get('/health', async (req, res) => {
    try {
        const { data, error } = await insforgeAdmin.database.from('profiles').select('count');
        if (error) throw error;
        res.json({
            success: true,
            status: 'online',
            message: 'InsForge PostgreSQL backend is active and reachable.',
            projectUrl: process.env.INSFORGE_URL || 'https://y5j2m9b9.us-east.insforge.app',
            tables: [
                'profiles',
                'vehicles',
                'service_appointments',
                'service_records',
                'parts',
                'service_parts',
                'bills'
            ],
            rlsEnabled: true,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Failed to communicate with InsForge PostgreSQL.',
            error: err.message
        });
    }
});

module.exports = router;
