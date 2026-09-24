require('dotenv').config({ path: 'c:\\Users\\vaibh\\Downloads\\GarageFlow\\.env' });
const fs = require('fs');
const path = require('path');
const sqlite3 = require('c:\\Users\\vaibh\\Downloads\\GarageFlow\\node_modules\\sqlite3').verbose();
const { insforgeClient, insforgeAdmin } = require('../services/insforge/client');

const dbPath = 'c:\\Users\\vaibh\\Downloads\\GarageFlow\\server\\database\\garageflow.sqlite';
const mappingFilePath = 'c:\\Users\\vaibh\\Downloads\\GarageFlow\\server\\database\\migration_mapping.json';

const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

function querySqlite(sql) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(sql, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrateData() {
    console.log('===========================================================');
    console.log('🚀 Starting GarageFlow Data Migration: SQLite -> InsForge');
    console.log('===========================================================\n');

    const mapping = {
        users: {},       // old_user_id -> insforge_user_uuid
        vehicles: {},    // old_vehicle_id -> insforge_vehicle_uuid
        appointments: {},// old_appointment_id -> insforge_appointment_uuid
        records: {},     // old_record_id -> insforge_record_uuid
        parts: {}        // old_part_id -> insforge_part_uuid
    };

    // -------------------------------------------------------------
    // Step 1: Migrate Users & Profiles to InsForge Auth + profiles
    // -------------------------------------------------------------
    console.log('[1/7] Migrating Users & Profiles to InsForge Auth...');
    const users = await querySqlite('SELECT * FROM users');

    for (const u of users) {
        let userUuid = null;
        const defaultPassword = u.role === 'ADMIN' ? 'Admin@123' : 'Customer@123';

        // 1. Try to sign up user in InsForge Auth
        try {
            const { data: signUpData, error: signUpError } = await insforgeClient.auth.signUp({
                email: u.email,
                password: defaultPassword,
                name: u.name
            });

            if (signUpData?.user?.id || signUpData?.id) {
                userUuid = signUpData?.user?.id || signUpData?.id;
                console.log(`  ✓ Created InsForge Auth user: ${u.email} -> ${userUuid}`);
            } else if (signUpError) {
                // If user already exists in InsForge Auth, log in to retrieve UUID
                const { data: signInData, error: signInError } = await insforgeClient.auth.signInWithPassword({
                    email: u.email,
                    password: defaultPassword
                });

                if (signInData?.user?.id) {
                    userUuid = signInData.user.id;
                    console.log(`  ✓ Re-authenticated existing InsForge Auth user: ${u.email} -> ${userUuid}`);
                } else {
                    console.error(`  ✗ Auth failed for ${u.email}:`, signUpError.message || signInError?.message);
                }
            }
        } catch (err) {
            console.error(`  ✗ Error creating auth for ${u.email}:`, err.message);
        }

        if (userUuid) {
            mapping.users[u.id] = userUuid;

            // Upsert profile into public.profiles
            const { error: profileError } = await insforgeAdmin.database
                .from('profiles')
                .upsert([{
                    id: userUuid,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    role: u.role
                }]);

            if (profileError) {
                console.error(`  ✗ Profile sync error for ${u.email}:`, profileError.message);
            } else {
                console.log(`  ✓ Synced profile for: ${u.name} (${u.role})`);
            }
        }
    }

    // -------------------------------------------------------------
    // Step 2: Migrate Vehicles
    // -------------------------------------------------------------
    console.log('\n[2/7] Migrating Vehicles...');
    const vehicles = await querySqlite('SELECT * FROM vehicles');

    for (const v of vehicles) {
        const insforgeUserId = mapping.users[v.user_id];
        if (!insforgeUserId) {
            console.warn(`  ⚠ Skipping vehicle ${v.registration_number}: mapped user_id not found for old ID ${v.user_id}`);
            continue;
        }

        // Check if vehicle already exists by registration_number
        const { data: existing } = await insforgeAdmin.database
            .from('vehicles')
            .select('id')
            .eq('registration_number', v.registration_number)
            .limit(1);

        if (existing && existing.length > 0) {
            mapping.vehicles[v.id] = existing[0].id;
            console.log(`  ✓ Vehicle already exists: ${v.registration_number} -> ${existing[0].id}`);
        } else {
            const { data, error } = await insforgeAdmin.database
                .from('vehicles')
                .insert([{
                    user_id: insforgeUserId,
                    registration_number: v.registration_number,
                    brand: v.brand,
                    model: v.model,
                    year: v.year,
                    fuel_type: v.fuel_type,
                    vehicle_type: v.vehicle_type,
                    mileage: v.mileage
                }])
                .select();

            if (error) {
                console.error(`  ✗ Error inserting vehicle ${v.registration_number}:`, error.message);
            } else if (data && data.length > 0) {
                mapping.vehicles[v.id] = data[0].id;
                console.log(`  ✓ Migrated vehicle: ${v.registration_number} -> ${data[0].id}`);
            }
        }
    }

    // -------------------------------------------------------------
    // Step 3: Migrate Appointments
    // -------------------------------------------------------------
    console.log('\n[3/7] Migrating Appointments...');
    const appointments = await querySqlite('SELECT * FROM service_appointments');

    for (const a of appointments) {
        const insforgeVehicleId = mapping.vehicles[a.vehicle_id];
        const insforgeUserId = mapping.users[a.user_id];

        if (!insforgeVehicleId || !insforgeUserId) {
            console.warn(`  ⚠ Skipping appointment ${a.id}: missing vehicle or user mapping`);
            continue;
        }

        const { data, error } = await insforgeAdmin.database
            .from('service_appointments')
            .insert([{
                vehicle_id: insforgeVehicleId,
                user_id: insforgeUserId,
                service_type: a.service_type,
                appointment_date: a.appointment_date,
                appointment_time: a.appointment_time,
                mileage: a.mileage,
                description: a.description || '',
                status: a.status
            }])
            .select();

        if (error) {
            console.error(`  ✗ Error inserting appointment ${a.id}:`, error.message);
        } else if (data && data.length > 0) {
            mapping.appointments[a.id] = data[0].id;
            console.log(`  ✓ Migrated appointment #${a.id} (${a.service_type}) -> ${data[0].id}`);
        }
    }

    // -------------------------------------------------------------
    // Step 4: Migrate Service Records
    // -------------------------------------------------------------
    console.log('\n[4/7] Migrating Service Records...');
    const records = await querySqlite('SELECT * FROM service_records');

    for (const r of records) {
        const insforgeApptId = mapping.appointments[r.appointment_id];
        const insforgeVehicleId = mapping.vehicles[r.vehicle_id];

        if (!insforgeApptId || !insforgeVehicleId) {
            console.warn(`  ⚠ Skipping service record ${r.id}: missing appt or vehicle mapping`);
            continue;
        }

        const { data, error } = await insforgeAdmin.database
            .from('service_records')
            .insert([{
                appointment_id: insforgeApptId,
                vehicle_id: insforgeVehicleId,
                service_date: r.service_date,
                mileage: r.mileage,
                service_description: r.service_description,
                technician_notes: r.technician_notes || '',
                labour_cost: r.labour_cost,
                total_cost: r.total_cost
            }])
            .select();

        if (error) {
            console.error(`  ✗ Error inserting service record ${r.id}:`, error.message);
        } else if (data && data.length > 0) {
            mapping.records[r.id] = data[0].id;
            console.log(`  ✓ Migrated service record #${r.id} -> ${data[0].id}`);
        }
    }

    // -------------------------------------------------------------
    // Step 5: Migrate Parts
    // -------------------------------------------------------------
    console.log('\n[5/7] Migrating Parts Catalog...');
    const parts = await querySqlite('SELECT * FROM parts');

    for (const p of parts) {
        // Check if part number already exists
        const { data: existing } = await insforgeAdmin.database
            .from('parts')
            .select('id')
            .eq('part_number', p.part_number)
            .limit(1);

        if (existing && existing.length > 0) {
            mapping.parts[p.id] = existing[0].id;
            console.log(`  ✓ Part already exists: ${p.part_name} -> ${existing[0].id}`);
        } else {
            const { data, error } = await insforgeAdmin.database
                .from('parts')
                .insert([{
                    part_name: p.part_name,
                    part_number: p.part_number,
                    category: p.category,
                    quantity: p.quantity,
                    unit_price: p.unit_price,
                    minimum_stock: p.minimum_stock
                }])
                .select();

            if (error) {
                console.error(`  ✗ Error inserting part ${p.part_name}:`, error.message);
            } else if (data && data.length > 0) {
                mapping.parts[p.id] = data[0].id;
                console.log(`  ✓ Migrated part: ${p.part_name} -> ${data[0].id}`);
            }
        }
    }

    // -------------------------------------------------------------
    // Step 6: Migrate Service Parts
    // -------------------------------------------------------------
    console.log('\n[6/7] Migrating Service Parts...');
    const serviceParts = await querySqlite('SELECT * FROM service_parts');

    for (const sp of serviceParts) {
        const insforgeRecordId = mapping.records[sp.service_record_id];
        const insforgePartId = mapping.parts[sp.part_id];

        if (!insforgeRecordId || !insforgePartId) {
            console.warn(`  ⚠ Skipping service part ${sp.id}: missing record or part mapping`);
            continue;
        }

        const { error } = await insforgeAdmin.database
            .from('service_parts')
            .insert([{
                service_record_id: insforgeRecordId,
                part_id: insforgePartId,
                quantity_used: sp.quantity_used,
                unit_price: sp.unit_price
            }]);

        if (error) {
            console.error(`  ✗ Error inserting service part ${sp.id}:`, error.message);
        } else {
            console.log(`  ✓ Migrated service part usage #${sp.id}`);
        }
    }

    // -------------------------------------------------------------
    // Step 7: Migrate Bills
    // -------------------------------------------------------------
    console.log('\n[7/7] Migrating Bills & Invoices...');
    const bills = await querySqlite('SELECT * FROM bills');

    for (const b of bills) {
        const insforgeRecordId = mapping.records[b.service_record_id];
        const insforgeCustomerId = mapping.users[b.customer_id];

        if (!insforgeRecordId || !insforgeCustomerId) {
            console.warn(`  ⚠ Skipping bill ${b.id}: missing record or customer mapping`);
            continue;
        }

        const { error } = await insforgeAdmin.database
            .from('bills')
            .insert([{
                service_record_id: insforgeRecordId,
                customer_id: insforgeCustomerId,
                subtotal: b.subtotal,
                tax: b.tax,
                total: b.total,
                payment_status: b.payment_status
            }]);

        if (error) {
            console.error(`  ✗ Error inserting bill ${b.id}:`, error.message);
        } else {
            console.log(`  ✓ Migrated bill #${b.id} ($${b.total})`);
        }
    }

    // Save migration mapping
    fs.writeFileSync(mappingFilePath, JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`\n✓ Saved ID remapping table to: ${mappingFilePath}`);

    sqliteDb.close();
    console.log('\n===========================================================');
    console.log('🎉 Data Migration Completed Successfully!');
    console.log('===========================================================');
}

migrateData().catch(err => {
    console.error('Fatal migration error:', err);
    sqliteDb.close();
    process.exit(1);
});
