const { insforgeAdmin } = require('./client');
const { resolveUserId, resolveBillId, resolveRecordId } = require('./idMapper');

async function getBills(userId, isAdmin = false) {
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('bills').select('*');
    if (!isAdmin && resolvedUid) {
        query = query.eq('customer_id', resolvedUid);
    }
    const { data: bills, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    if (!bills || bills.length === 0) return [];

    // Fetch related profiles, service records, and vehicles
    const { data: profiles } = await insforgeAdmin.database.from('profiles').select('id, name, email, phone');
    const { data: records } = await insforgeAdmin.database.from('service_records').select('id, vehicle_id, service_date');
    const { data: vehicles } = await insforgeAdmin.database.from('vehicles').select('id, registration_number, brand, model');

    const pMap = {};
    (profiles || []).forEach(p => { pMap[p.id] = p; });
    const rMap = {};
    (records || []).forEach(r => { rMap[r.id] = r; });
    const vMap = {};
    (vehicles || []).forEach(v => { vMap[v.id] = v; });

    return bills.map(b => {
        const p = pMap[b.customer_id] || {};
        const r = rMap[b.service_record_id] || {};
        const v = vMap[r.vehicle_id] || {};
        return {
            ...b,
            customer_name: p.name || '',
            customer_email: p.email || '',
            customer_phone: p.phone || '',
            registration_number: v.registration_number || '',
            brand: v.brand || '',
            model: v.model || '',
            service_date: r.service_date || ''
        };
    });
}

async function getBillById(billId) {
    const resolvedBid = resolveBillId(billId);
    const { data, error } = await insforgeAdmin.database
        .from('bills')
        .select('*')
        .eq('id', resolvedBid)
        .limit(1);

    if (error) throw new Error(error.message);
    const bill = data && data.length > 0 ? data[0] : null;
    if (!bill) return null;

    // Fetch customer profile
    const { data: pData } = await insforgeAdmin.database.from('profiles').select('*').eq('id', bill.customer_id).limit(1);
    const profile = pData && pData.length > 0 ? pData[0] : {};

    // Fetch service record
    const { data: rData } = await insforgeAdmin.database.from('service_records').select('*').eq('id', bill.service_record_id).limit(1);
    const record = rData && rData.length > 0 ? rData[0] : {};

    // Fetch vehicle & appointment
    const { data: vData } = await insforgeAdmin.database.from('vehicles').select('*').eq('id', record.vehicle_id).limit(1);
    const vehicle = vData && vData.length > 0 ? vData[0] : {};

    const { data: aData } = await insforgeAdmin.database.from('service_appointments').select('*').eq('id', record.appointment_id).limit(1);
    const appointment = aData && aData.length > 0 ? aData[0] : {};

    const enrichedBill = {
        ...bill,
        customer_name: profile.name || '',
        customer_email: profile.email || '',
        customer_phone: profile.phone || '',
        registration_number: vehicle.registration_number || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        fuel_type: vehicle.fuel_type || '',
        vehicle_type: vehicle.vehicle_type || '',
        service_date: record.service_date || '',
        mileage: record.mileage || 0,
        service_description: record.service_description || '',
        technician_notes: record.technician_notes || '',
        labour_cost: record.labour_cost || 0,
        service_type: appointment.service_type || ''
    };

    // Fetch parts
    const { data: spList } = await insforgeAdmin.database.from('service_parts').select('*').eq('service_record_id', bill.service_record_id);
    const { data: allParts } = await insforgeAdmin.database.from('parts').select('id, part_name, part_number');
    const partMap = {};
    (allParts || []).forEach(p => { partMap[p.id] = p; });

    const parts = (spList || []).map(sp => ({
        ...sp,
        part_name: partMap[sp.part_id]?.part_name || '',
        part_number: partMap[sp.part_id]?.part_number || ''
    }));

    return {
        bill: enrichedBill,
        parts
    };
}

async function createBill({ serviceRecordId, customerId, subtotal, taxRate = 0.18, paymentStatus = 'Pending' }) {
    const resolvedRid = resolveRecordId(serviceRecordId);
    const resolvedCid = resolveUserId(customerId);

    const sub = parseFloat(subtotal || 0);
    const tax = parseFloat((sub * taxRate).toFixed(2));
    const total = parseFloat((sub + tax).toFixed(2));

    const { data, error } = await insforgeAdmin.database
        .from('bills')
        .insert([{
            service_record_id: resolvedRid,
            customer_id: resolvedCid,
            subtotal: sub,
            tax,
            total,
            payment_status: paymentStatus
        }])
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function updateBillPaymentStatus(billId, paymentStatus) {
    const resolvedBid = resolveBillId(billId);
    const { data, error } = await insforgeAdmin.database
        .from('bills')
        .update({ payment_status: paymentStatus })
        .eq('id', resolvedBid)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

module.exports = {
    getBills,
    getBillById,
    createBill,
    updateBillPaymentStatus
};

