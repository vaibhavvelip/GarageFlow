const { insforgeAdmin } = require('./client');
const { resolveUserId, resolveVehicleId, resolveApptId } = require('./idMapper');

const VALID_STATUSES = ['Requested', 'Confirmed', 'In Service', 'Ready', 'Completed', 'Cancelled'];

async function getAppointments(userId, isAdmin = false) {
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('service_appointments').select('*');
    if (!isAdmin && resolvedUid) {
        query = query.eq('user_id', resolvedUid);
    }
    const { data: appointments, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    if (!appointments || appointments.length === 0) return [];

    // Enrich with vehicle and user info
    const { data: vehicles } = await insforgeAdmin.database.from('vehicles').select('id, registration_number, brand, model, fuel_type');
    const { data: profiles } = await insforgeAdmin.database.from('profiles').select('id, name, email, phone');

    const vMap = {};
    (vehicles || []).forEach(v => { vMap[v.id] = v; });
    const pMap = {};
    (profiles || []).forEach(p => { pMap[p.id] = p; });

    return appointments.map(a => {
        const v = vMap[a.vehicle_id] || {};
        const p = pMap[a.user_id] || {};
        return {
            ...a,
            registration_number: v.registration_number || '',
            brand: v.brand || '',
            model: v.model || '',
            fuel_type: v.fuel_type || '',
            customer_name: p.name || '',
            customer_email: p.email || '',
            customer_phone: p.phone || ''
        };
    });
}

async function getAppointmentById(appointmentId, userId, isAdmin = false) {
    const resolvedAid = resolveApptId(appointmentId);
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('service_appointments').select('*').eq('id', resolvedAid);
    if (!isAdmin && resolvedUid) {
        query = query.eq('user_id', resolvedUid);
    }
    const { data, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    const appt = data && data.length > 0 ? data[0] : null;

    if (appt) {
        const { data: vData } = await insforgeAdmin.database.from('vehicles').select('registration_number, brand, model, fuel_type').eq('id', appt.vehicle_id).limit(1);
        const { data: pData } = await insforgeAdmin.database.from('profiles').select('name, email, phone').eq('id', appt.user_id).limit(1);

        const v = vData && vData.length > 0 ? vData[0] : {};
        const p = pData && pData.length > 0 ? pData[0] : {};

        appt.registration_number = v.registration_number || '';
        appt.brand = v.brand || '';
        appt.model = v.model || '';
        appt.fuel_type = v.fuel_type || '';
        appt.customer_name = p.name || '';
        appt.customer_email = p.email || '';
        appt.customer_phone = p.phone || '';
    }

    return appt;
}

async function createAppointment({ vehicleId, userId, serviceType, appointmentDate, appointmentTime, mileage, description }) {
    const resolvedVid = resolveVehicleId(vehicleId);
    const resolvedUid = resolveUserId(userId);

    const { data, error } = await insforgeAdmin.database
        .from('service_appointments')
        .insert([{
            vehicle_id: resolvedVid,
            user_id: resolvedUid,
            service_type: serviceType,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            mileage: parseInt(mileage || 0, 10),
            description: description || '',
            status: 'Requested'
        }])
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function updateAppointmentStatus(appointmentId, newStatus) {
    const resolvedAid = resolveApptId(appointmentId);
    if (!VALID_STATUSES.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}. Must be one of ${VALID_STATUSES.join(', ')}`);
    }

    const { data, error } = await insforgeAdmin.database
        .from('service_appointments')
        .update({ status: newStatus })
        .eq('id', resolvedAid)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function deleteAppointment(appointmentId, userId, isAdmin = false) {
    const resolvedAid = resolveApptId(appointmentId);
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('service_appointments').delete().eq('id', resolvedAid);
    if (!isAdmin && resolvedUid) {
        query = query.eq('user_id', resolvedUid);
    }
    const { error } = await query;
    if (error) throw new Error(error.message);
    return true;
}

module.exports = {
    getAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    VALID_STATUSES
};

