const { createClient, createAdminClient } = require('@insforge/sdk');
require('dotenv').config();

const baseUrl = process.env.INSFORGE_URL || 'https://y5j2m9b9.us-east.insforge.app';
const anonKey = process.env.INSFORGE_ANON_KEY;
const apiKey = process.env.INSFORGE_API_KEY;

// User-scoped client for public/authenticated operations
const insforgeClient = createClient({
    baseUrl,
    anonKey
});

// Admin client for privileged backend service operations
const insforgeAdmin = createAdminClient({
    baseUrl,
    apiKey
});

// Helper to create a client scoped with a specific user's Bearer token
function getUserClient(userAccessToken) {
    if (!userAccessToken) return insforgeClient;
    return createClient({
        baseUrl,
        anonKey,
        headers: {
            Authorization: `Bearer ${userAccessToken}`
        }
    });
}

module.exports = {
    insforgeClient,
    insforgeAdmin,
    getUserClient
};
