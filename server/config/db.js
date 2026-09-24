/**
 * Database Configuration & Connectivity Layer
 * GarageFlow is fully powered by InsForge PostgreSQL.
 * Embedded SQLite and legacy MySQL connection drivers have been decommissioned.
 */
const { insforgeAdmin } = require('../services/insforge/client');

const dbDriver = 'insforge-postgresql';

async function initDB() {
    try {
        const { error } = await insforgeAdmin.database
            .from('profiles')
            .select('id')
            .limit(1);

        if (error) {
            throw new Error(`InsForge PostgreSQL connectivity check failed: ${error.message}`);
        }

        console.log('[DB] Connected successfully to InsForge PostgreSQL backend.');
        return true;
    } catch (err) {
        console.error('[DB Error] Failed to connect to InsForge PostgreSQL:', err.message);
        throw err;
    }
}

async function checkHealth() {
    try {
        const startTime = Date.now();
        const { error } = await insforgeAdmin.database
            .from('profiles')
            .select('id')
            .limit(1);

        if (error) {
            return {
                connected: false,
                latencyMs: Date.now() - startTime,
                error: error.message
            };
        }

        return {
            connected: true,
            latencyMs: Date.now() - startTime,
            backend: 'InsForge PostgreSQL'
        };
    } catch (err) {
        return {
            connected: false,
            error: err.message
        };
    }
}

module.exports = {
    initDB,
    checkHealth,
    getDriver: () => dbDriver
};
