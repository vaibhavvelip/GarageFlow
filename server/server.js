const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const serviceRecordRoutes = require('./routes/serviceRecordRoutes');
const partRoutes = require('./routes/partRoutes');
const billRoutes = require('./routes/billRoutes');
const adminRoutes = require('./routes/adminRoutes');
const insforgeRoutes = require('./routes/insforgeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
const origins = [];
if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
    origins.push(...process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean));
}
if (process.env.RENDER_EXTERNAL_URL && !origins.includes(process.env.RENDER_EXTERNAL_URL)) {
    origins.push(process.env.RENDER_EXTERNAL_URL);
}
const allowedOrigins = origins.length > 0 ? origins : '*';

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/service-records', serviceRecordRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/insforge', insforgeRoutes);

// Base API Health Check (with live database connectivity probe)
app.get('/api/health', async (req, res) => {
    const health = await db.checkHealth();
    res.status(health.connected ? 200 : 503).json({
        success: health.connected,
        message: health.connected ? 'GarageFlow API Server is online.' : 'Database connectivity check failed.',
        databaseDriver: db.getDriver(),
        database: health,
        timestamp: new Date().toISOString()
    });
});

// Fallback route handler for single-page client navigation
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API Endpoint not found.' });
    }
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Global Error Handler (sanitizes error messages in production to prevent information disclosure)
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        message: isProd && status === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error')
    });
});

// Start Server & Init DB
async function startServer() {
    try {
        await db.initDB();
        app.listen(PORT, () => {
            console.log(`=======================================================`);
            console.log(` 🚗 GARAGEFLOW - Smart Vehicle Service Management System`);
            console.log(` 🚀 Server is running on: http://localhost:${PORT}`);
            console.log(` 📊 Active DB Driver: ${db.getDriver().toUpperCase()}`);
            console.log(`=======================================================`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
