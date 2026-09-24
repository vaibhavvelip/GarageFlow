const fs = require('fs');
const path = require('path');

const mappingPath = path.join(__dirname, '../../database/migration_mapping.json');
let mapping = { users: {}, vehicles: {}, appointments: {}, records: {}, parts: {} };

function loadMapping() {
    try {
        if (fs.existsSync(mappingPath)) {
            mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        }
    } catch (e) {
        console.warn('[ID Mapper] Warning reading mapping file:', e.message);
    }
}

loadMapping();

function isUuid(val) {
    if (!val || typeof val !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function resolveUserId(id) {
    if (!id) return null;
    if (isUuid(id)) return id;
    return mapping.users[String(id)] || id;
}

function resolveVehicleId(id) {
    if (!id) return null;
    if (isUuid(id)) return id;
    return mapping.vehicles[String(id)] || id;
}

function resolveApptId(id) {
    if (!id) return null;
    if (isUuid(id)) return id;
    return mapping.appointments[String(id)] || id;
}

function resolvePartId(id) {
    if (!id) return null;
    if (isUuid(id)) return id;
    return mapping.parts?.[String(id)] || id;
}

function resolveRecordId(id) {
    if (!id) return null;
    if (isUuid(id)) return id;
    return mapping.records?.[String(id)] || id;
}

function resolveBillId(id) {
    if (!id) return null;
    if (isUuid(id)) return id;
    return mapping.bills?.[String(id)] || id;
}

module.exports = {
    loadMapping,
    isUuid,
    resolveUserId,
    resolveVehicleId,
    resolveApptId,
    resolvePartId,
    resolveRecordId,
    resolveBillId,
    getMapping: () => mapping
};
