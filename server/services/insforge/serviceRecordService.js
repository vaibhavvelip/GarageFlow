const { insforgeAdmin } = require('./client');
const { resolveUserId, resolveVehicleId, resolveApptId, resolveRecordId, resolvePartId } = require('./idMapper');

async function getServiceRecords(userId, isAdmin = false) {
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let records = [];

    if (isAdmin) {
        const { data, error } = await insforgeAdmin.database
            .from('service_records')
            .select('*')
            .order('service_date', { ascending: false });
        if (error) throw new Error(error.message);
        records = data || [];
    } else {
        // Customer: records for user's vehicles
        const { data: userVehicles, error: vError } = await insforgeAdmin.database
            .from('vehicles')
            .select('id')
            .eq('user_id', resolvedUid);

        if (vError) throw new Error(vError.message);
        const vehicleIds = (userVehicles || []).map(v => v.id);

        if (vehicleIds.length === 0) return [];

        const { data, error } = await insforgeAdmin.database
            .from('service_records')
            .select('*')
            .order('service_date', { ascending: false });

        if (error) throw new Error(error.message);
        records = (data || []).filter(sr => vehicleIds.includes(sr.vehicle_id));
    }

    if (records.length === 0) return [];

    // Enrich records with vehicle, user, appointment details
    const { data: vehicles } = await insforgeAdmin.database.from('vehicles').select('id, user_id, registration_number, brand, model');
    const { data: appointments } = await insforgeAdmin.database.from('service_appointments').select('id, service_type');
    const { data: profiles } = await insforgeAdmin.database.from('profiles').select('id, name, email');

    const vMap = {};
    (vehicles || []).forEach(v => { vMap[v.id] = v; });
    const aMap = {};
    (appointments || []).forEach(a => { aMap[a.id] = a; });
    const pMap = {};
    (profiles || []).forEach(p => { pMap[p.id] = p; });

    return records.map(sr => {
        const v = vMap[sr.vehicle_id] || {};
        const p = pMap[v.user_id] || {};
        const a = aMap[sr.appointment_id] || {};
        return {
            ...sr,
            registration_number: v.registration_number || '',
            brand: v.brand || '',
            model: v.model || '',
            customer_name: p.name || '',
            customer_email: p.email || '',
            service_type: a.service_type || ''
        };
    });
}

async function getServiceRecordById(recordId) {
    const resolvedRid = resolveRecordId(recordId);
    const { data, error } = await insforgeAdmin.database
        .from('service_records')
        .select('*')
        .eq('id', resolvedRid)
        .limit(1);

    if (error) throw new Error(error.message);
    const record = data && data.length > 0 ? data[0] : null;
    if (!record) return null;

    // Fetch vehicle, appointment, user, parts used, and bill
    const { data: vData } = await insforgeAdmin.database.from('vehicles').select('*').eq('id', record.vehicle_id).limit(1);
    const vehicle = vData && vData.length > 0 ? vData[0] : {};

    const { data: pData } = await insforgeAdmin.database.from('profiles').select('*').eq('id', vehicle.user_id).limit(1);
    const profile = pData && pData.length > 0 ? pData[0] : {};

    const { data: aData } = await insforgeAdmin.database.from('service_appointments').select('*').eq('id', record.appointment_id).limit(1);
    const appointment = aData && aData.length > 0 ? aData[0] : {};

    const enrichedRecord = {
        ...record,
        registration_number: vehicle.registration_number || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        fuel_type: vehicle.fuel_type || '',
        vehicle_type: vehicle.vehicle_type || '',
        customer_id: vehicle.user_id || '',
        customer_name: profile.name || '',
        customer_email: profile.email || '',
        customer_phone: profile.phone || '',
        service_type: appointment.service_type || '',
        appointment_description: appointment.description || ''
    };

    // Parts used with part details
    const { data: spList } = await insforgeAdmin.database.from('service_parts').select('*').eq('service_record_id', resolvedRid);
    const { data: allParts } = await insforgeAdmin.database.from('parts').select('id, part_name, part_number');
    const partMap = {};
    (allParts || []).forEach(p => { partMap[p.id] = p; });

    const partsUsed = (spList || []).map(sp => ({
        ...sp,
        part_name: partMap[sp.part_id]?.part_name || '',
        part_number: partMap[sp.part_id]?.part_number || ''
    }));

    // Bill
    const { data: billList } = await insforgeAdmin.database.from('bills').select('*').eq('service_record_id', resolvedRid).limit(1);
    const bill = billList && billList.length > 0 ? billList[0] : null;

    return {
        serviceRecord: enrichedRecord,
        partsUsed,
        bill
    };
}

async function createServiceRecord({ appointmentId, serviceDate, mileage, serviceDescription, technicianNotes, labourCost = 0, partsUsed = [] }) {
    const resolvedAid = resolveApptId(appointmentId);

    // Format parts with resolved UUIDs
    const formattedParts = (partsUsed || []).map(p => ({
        part_id: resolvePartId(p.partId || p.part_id),
        quantity_used: parseInt(p.quantity || p.quantity_used || 1, 10),
        unit_price: p.unitPrice !== undefined ? parseFloat(p.unitPrice) : (p.unit_price !== undefined ? parseFloat(p.unit_price) : null)
    }));

    const { data, error } = await insforgeAdmin.database.rpc('create_service_record_atomic', {
        p_appointment_id: resolvedAid,
        p_service_date: serviceDate,
        p_mileage: parseInt(mileage || 0, 10),
        p_service_description: serviceDescription,
        p_technician_notes: technicianNotes || '',
        p_labour_cost: parseFloat(labourCost || 0),
        p_parts: formattedParts
    });

    if (error) {
        throw new Error(error.message);
    }

    const resObj = typeof data === 'string' ? JSON.parse(data) : data;

    return {
        record: { id: resObj.service_record_id },
        bill: { id: resObj.bill_id },
        grandTotal: resObj.total_cost
    };
}

module.exports = {
    getServiceRecords,
    getServiceRecordById,
    createServiceRecord
};

