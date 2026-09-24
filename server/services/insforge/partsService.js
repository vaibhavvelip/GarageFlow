const { insforgeAdmin } = require('./client');
const { resolvePartId } = require('./idMapper');

async function getParts(search = '', lowStockOnly = false) {
    let query = insforgeAdmin.database.from('parts').select('*');
    if (search && search.trim()) {
        query = query.ilike('part_name', `%${search.trim()}%`);
    }
    const { data, error } = await query.order('part_name', { ascending: true });
    if (error) throw new Error(error.message);

    let parts = data || [];
    if (lowStockOnly) {
        parts = parts.filter(p => p.quantity <= p.minimum_stock);
    }
    return parts;
}

async function getPartById(partId) {
    const resolvedPid = resolvePartId(partId);
    const { data, error } = await insforgeAdmin.database
        .from('parts')
        .select('*')
        .eq('id', resolvedPid)
        .limit(1);

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function getLowStockParts() {
    const { data, error } = await insforgeAdmin.database
        .from('parts')
        .select('*');

    if (error) throw new Error(error.message);
    return (data || []).filter(p => p.quantity <= p.minimum_stock);
}

async function createPart({ partName, partNumber, category, quantity, unitPrice, minimumStock }) {
    const { data, error } = await insforgeAdmin.database
        .from('parts')
        .insert([{
            part_name: partName,
            part_number: (partNumber || '').toUpperCase(),
            category,
            quantity: parseInt(quantity || 0, 10),
            unit_price: parseFloat(unitPrice || 0),
            minimum_stock: parseInt(minimumStock !== undefined ? minimumStock : 5, 10)
        }])
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function updatePart(partId, updateData) {
    const resolvedPid = resolvePartId(partId);
    const { data, error } = await insforgeAdmin.database
        .from('parts')
        .update(updateData)
        .eq('id', resolvedPid)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

async function deletePart(partId) {
    const resolvedPid = resolvePartId(partId);
    const { error } = await insforgeAdmin.database
        .from('parts')
        .delete()
        .eq('id', resolvedPid);

    if (error) throw new Error(error.message);
    return true;
}

module.exports = {
    getParts,
    getPartById,
    getLowStockParts,
    createPart,
    updatePart,
    deletePart
};

