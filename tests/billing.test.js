/**
 * GarageFlow - Billing Bugs Verification & Regression Test Suite
 *
 * Verifies:
 * 1. Bug 1 Fix: Bill details retrieval and display (GET /api/bills/:id)
 *    - Correct bill ID passed (UUID)
 *    - Loading and parts retrieval
 *    - Missing bill handling (404)
 *    - Customer ownership enforcement (403 for unauthorized customer)
 * 2. Bug 2 Fix: Payment status update & persistence (PUT /api/bills/:id/status)
 *    - Validation (invalid status returns 400)
 *    - Admin role enforcement (customer gets 403)
 *    - Unauthenticated request gets 401
 *    - Persistence to InsForge PostgreSQL via server-side admin client
 *    - Response envelope returns updated bill
 *    - Refresh/re-fetch confirms payment_status remains 'Paid'
 *    - Revert back to original status cleanly
 */

const assert = require('assert');

const TARGET_HOST = process.env.TARGET_HOST || 'http://localhost:5000';
const API_BASE = `${TARGET_HOST}/api`;

console.log('================================================================');
console.log('🧪 GARAGEFLOW BILLING BUGS & RBAC VERIFICATION SUITE');
console.log(`🌐 Target: ${API_BASE}`);
console.log('================================================================\n');

async function request(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }
    return { status: res.status, headers: res.headers, data };
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        process.stdout.write(`  ⏳ ${name}... `);
        await fn();
        console.log('✅ PASSED');
        passed++;
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        failed++;
    }
}

async function runTests() {
    let adminToken, customerToken, otherCustomerToken;
    let testBillId, originalStatus;

    // --- STEP 1: Authentication & Setup ---
    console.log('--- 1. Authentication & Role Setup ---');

    await test('Admin login (admin@garageflow.com)', async () => {
        const res = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@garageflow.com', password: 'Admin@123' })
        });
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.user.role, 'ADMIN');
        adminToken = res.data.token;
    });

    await test('Customer login (john.doe@example.com)', async () => {
        const res = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'john.doe@example.com', password: 'Customer@123' })
        });
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.user.role, 'CUSTOMER');
        customerToken = res.data.token;
    });

    await test('Register temporary second customer for RBAC boundary testing', async () => {
        const tempEmail = `other.customer.${Date.now()}@example.com`;
        const res = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Other Customer',
                email: tempEmail,
                password: 'Password@123',
                phone: '+1 555-999-8888'
            })
        });
        assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
        otherCustomerToken = res.data.token;
    });

    // --- STEP 2: Fetch Bills Ledger & Identify Target Bill ---
    console.log('\n--- 2. Bill Listing & ID Verification ---');

    await test('Admin fetches bills ledger (GET /api/bills)', async () => {
        const res = await request('/bills', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert(Array.isArray(res.data.bills), 'bills must be an array');
        assert(res.data.bills.length > 0, 'Should have at least 1 bill in database');

        const bill = res.data.bills[0];
        testBillId = bill.id;
        originalStatus = bill.payment_status;
        assert(typeof testBillId === 'string' && testBillId.length >= 32, 'Bill ID must be a UUID string');
        console.log(`\n     Target Bill UUID: ${testBillId} (Current Status: ${originalStatus})`);
    });

    await test('Customer fetches own bills (GET /api/bills)', async () => {
        const res = await request('/bills', {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert(Array.isArray(res.data.bills));
    });

    // --- STEP 3: Bug 1 — Bill Details Retrieval (View Bill) ---
    console.log('\n--- 3. Bug 1 Fix: Bill Details Retrieval (View Bill) ---');

    await test('Admin retrieves bill details with UUID (GET /api/bills/:id)', async () => {
        const res = await request(`/bills/${testBillId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert(res.data.bill, 'Must return bill object');
        assert.strictEqual(res.data.bill.id, testBillId);
        assert(res.data.bill.customer_name, 'Must have customer_name');
        assert(res.data.bill.registration_number, 'Must have registration_number');
        assert(res.data.bill.subtotal !== undefined, 'Must have subtotal');
        assert(res.data.bill.tax !== undefined, 'Must have tax');
        assert(res.data.bill.total !== undefined, 'Must have total');
        assert(Array.isArray(res.data.parts), 'Must return parts array');
    });

    await test('Missing bill returns 404 Not Found', async () => {
        const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
        const res = await request(`/bills/${nonExistentUuid}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 404);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.message, 'Bill not found.');
    });

    await test('Second customer cannot view another customer bill (returns 403 Forbidden)', async () => {
        const res = await request(`/bills/${testBillId}`, {
            headers: { Authorization: `Bearer ${otherCustomerToken}` }
        });
        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.message, 'Access denied.');
    });

    // --- STEP 4: Bug 2 — Payment Status Update & Persistence ---
    console.log('\n--- 4. Bug 2 Fix: Payment Status Update & Persistence ---');

    await test('Admin marks bill as Paid (PUT /api/bills/:id/status)', async () => {
        const res = await request(`/bills/${testBillId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ payment_status: 'Paid' })
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.bill.payment_status, 'Paid', 'Response envelope must return updated bill with status Paid');
        assert.strictEqual(res.data.bill.id, testBillId);
    });

    await test('Re-fetch bill directly (GET /api/bills/:id) confirms Paid persisted in PostgreSQL', async () => {
        const res = await request(`/bills/${testBillId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.bill.payment_status, 'Paid', 'Must remain Paid after re-fetching from database');
    });

    await test('Re-fetch bills ledger (GET /api/bills) confirms Paid in full list (page reload simulation)', async () => {
        const res = await request('/bills', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);
        const bill = res.data.bills.find(b => b.id === testBillId);
        assert(bill, 'Target bill must be in list');
        assert.strictEqual(bill.payment_status, 'Paid', 'Ledger after simulated reload must have payment_status Paid');
    });

    await test('Revert bill status back to original (PUT /api/bills/:id/status)', async () => {
        const res = await request(`/bills/${testBillId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ payment_status: originalStatus || 'Pending' })
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.bill.payment_status, originalStatus || 'Pending');

        // Confirm revert persisted
        const verifyRes = await request(`/bills/${testBillId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(verifyRes.data.bill.payment_status, originalStatus || 'Pending');
    });

    // --- STEP 5: Input Validation & Error Handling ---
    console.log('\n--- 5. Failed Updates & Validation ---');

    await test('Reject invalid payment status (returns 400 Bad Request)', async () => {
        const res = await request(`/bills/${testBillId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ payment_status: 'Completed' }) // Invalid status
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.success, false);
        assert(res.data.message.includes('Payment status must be one of'));
    });

    await test('Reject empty payment status (returns 400 Bad Request)', async () => {
        const res = await request(`/bills/${testBillId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({})
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.success, false);
    });

    await test('Update non-existent bill returns 404 Not Found', async () => {
        const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
        const res = await request(`/bills/${nonExistentUuid}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ payment_status: 'Paid' })
        });
        assert.strictEqual(res.status, 404);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.message, 'Bill not found.');
    });

    // --- STEP 6: Security & RBAC Boundaries ---
    console.log('\n--- 6. Security & Authorization Checks ---');

    await test('Unauthenticated request to GET /api/bills returns 401', async () => {
        const res = await request('/bills');
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
    });

    await test('Unauthenticated request to GET /api/bills/:id returns 401', async () => {
        const res = await request(`/bills/${testBillId}`);
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
    });

    await test('Unauthenticated request to PUT /api/bills/:id/status returns 401', async () => {
        const res = await request(`/bills/${testBillId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ payment_status: 'Paid' })
        });
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
    });

    await test('Customer cannot change payment status (PUT /api/bills/:id/status returns 403 Forbidden)', async () => {
        const res = await request(`/bills/${testBillId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: JSON.stringify({ payment_status: 'Paid' })
        });
        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.data.success, false);
        assert(res.data.message.includes('Access forbidden'));
    });

    await test('Customer cannot change payment status via PATCH /api/bills/:id/status (returns 403)', async () => {
        const res = await request(`/bills/${testBillId}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: JSON.stringify({ payment_status: 'Paid' })
        });
        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.data.success, false);
    });

    await test('Customer cannot change payment status via PUT /api/bills/:id/payment-status (returns 403)', async () => {
        const res = await request(`/bills/${testBillId}/payment-status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: JSON.stringify({ payment_status: 'Paid' })
        });
        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.data.success, false);
    });

    // --- Summary ---
    console.log('\n================================================================');
    console.log(`📊 RESULTS: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
