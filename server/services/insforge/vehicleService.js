const { insforgeAdmin } = require('./client');
const { resolveUserId, resolveVehicleId } = require('./idMapper');

async function getVehicles(userId, isAdmin = false) {
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('vehicles').select('*');
    if (!isAdmin && resolvedUid) {
        query = query.eq('user_id', resolvedUid);
    }
    const { data: vehicles, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    if (isAdmin && vehicles && vehicles.length > 0) {
        const { data: profiles } = await insforgeAdmin.database.from('profiles').select('id, name, email, phone');
        const pMap = {};
        (profiles || []).forEach(p => { pMap[p.id] = p; });
        return vehicles.map(v => ({
            ...v,
            owner_name: pMap[v.user_id]?.name || '',
            owner_email: pMap[v.user_id]?.email || '',
            owner_phone: pMap[v.user_id]?.phone || ''
        }));
    }

    return vehicles || [];
}

async function getVehicleById(vehicleId, userId, isAdmin = false) {
    const resolvedVid = resolveVehicleId(vehicleId);
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('vehicles').select('*').eq('id', resolvedVid);
    if (!isAdmin && resolvedUid) {
        query = query.eq('user_id', resolvedUid);
    }
    const { data, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    const vehicle = data && data.length > 0 ? data[0] : null;

    if (vehicle && isAdmin) {
        const { data: profile } = await insforgeAdmin.database.from('profiles').select('name, email, phone').eq('id', vehicle.user_id).limit(1);
        if (profile && profile.length > 0) {
            vehicle.owner_name = profile[0].name;
            vehicle.owner_email = profile[0].email;
            vehicle.owner_phone = profile[0].phone;
        }
    }

    return vehicle;
}

async function createVehicle({ userId, registrationNumber, brand, model, year, fuelType, vehicleType, mileage }) {
    const resolvedUid = resolveUserId(userId);
    const { data, error } = await insforgeAdmin.database
        .from('vehicles')
        .insert([{
            user_id: resolvedUid,
            registration_number: (registrationNumber || '').toUpperCase(),
            brand,
            model,
            year: parseInt(year, 10),
            fuel_type: fuelType,
            vehicle_type: vehicleType,
            mileage: parseInt(mileage || 0, 10)
        }])
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function updateVehicle(vehicleId, userId, updateData, isAdmin = false) {
    const resolvedVid = resolveVehicleId(vehicleId);
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('vehicles').update(updateData).eq('id', resolvedVid);
    if (!isAdmin && resolvedUid) {
        query = query.eq('user_id', resolvedUid);
    }
    const { data, error } = await query.select();
    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function deleteVehicle(vehicleId, userId, isAdmin = false) {
    const resolvedVid = resolveVehicleId(vehicleId);
    const resolvedUid = userId ? resolveUserId(userId) : null;
    let query = insforgeAdmin.database.from('vehicles').delete().eq('id', resolvedVid);
    if (!isAdmin && resolvedUid) {
        query = query.eq('user_id', resolvedUid);
    }
    const { error } = await query;
    if (error) throw new Error(error.message);
    return true;
}

module.exports = {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle
};

