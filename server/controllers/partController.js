const partsService = require('../services/insforge/partsService');
const idMapper = require('../services/insforge/idMapper');
const { insforgeAdmin } = require('../services/insforge/client');

// Get all parts in inventory (with optional search and low_stock filter)
async function getParts(req, res) {
    try {
        const { search, low_stock } = req.query;
        const parts = await partsService.getParts(search, low_stock === 'true');
        return res.json({ success: true, count: parts.length, parts });
    } catch (err) {
        console.error('Get Parts Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve parts inventory.' });
    }
}

// Get single part by ID
async function getPartById(req, res) {
    try {
        const { id } = req.params;
        const part = await partsService.getPartById(id);
        if (!part) {
            return res.status(404).json({ success: false, message: 'Part not found.' });
        }
        return res.json({ success: true, part });
    } catch (err) {
        console.error('Get Part By ID Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve part details.' });
    }
}

// Add new part to inventory (Admin only)
async function addPart(req, res) {
    try {
        const { part_name, part_number, category, quantity, unit_price, minimum_stock } = req.body;

        if (!part_name || !part_number || !category || quantity === undefined || unit_price === undefined) {
            return res.status(400).json({ success: false, message: 'Part name, number, category, quantity, and unit price are required.' });
        }

        const qty = parseInt(quantity);
        const price = parseFloat(unit_price);
        const minStock = minimum_stock !== undefined ? parseInt(minimum_stock) : 5;

        if (qty < 0) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be negative.' });
        }

        if (price < 0) {
            return res.status(400).json({ success: false, message: 'Unit price cannot be negative.' });
        }

        // Check duplicate in InsForge
        const { data: existing, error: checkError } = await insforgeAdmin.database
            .from('parts')
            .select('id')
            .eq('part_number', part_number.toUpperCase())
            .limit(1);

        if (checkError) {
            throw new Error(checkError.message);
        }

        if (existing && existing.length > 0) {
            return res.status(409).json({ success: false, message: 'A part with this part number already exists.' });
        }

        const part = await partsService.createPart({
            partName: part_name,
            partNumber: part_number,
            category,
            quantity: qty,
            unitPrice: price,
            minimumStock: minStock
        });

        return res.status(201).json({
            success: true,
            message: 'Part added to inventory successfully.',
            partId: part.id
        });
    } catch (err) {
        console.error('Add Part Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to add part to inventory.' });
    }
}

// Update part details (Admin only)
async function updatePart(req, res) {
    try {
        const { id } = req.params;
        const { part_name, category, quantity, unit_price, minimum_stock } = req.body;

        const part = await partsService.getPartById(id);
        if (!part) {
            return res.status(404).json({ success: false, message: 'Part not found.' });
        }

        const updateData = {};
        if (part_name !== undefined) updateData.part_name = part_name;
        if (category !== undefined) updateData.category = category;
        if (quantity !== undefined) {
            const qty = parseInt(quantity);
            if (qty < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative.' });
            updateData.quantity = qty;
        }
        if (unit_price !== undefined) updateData.unit_price = parseFloat(unit_price);
        if (minimum_stock !== undefined) updateData.minimum_stock = parseInt(minimum_stock);

        await partsService.updatePart(id, updateData);
        return res.json({ success: true, message: 'Part inventory updated successfully.' });
    } catch (err) {
        console.error('Update Part Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to update part.' });
    }
}

// Delete part (Admin only)
async function deletePart(req, res) {
    try {
        const { id } = req.params;

        const part = await partsService.getPartById(id);
        if (!part) {
            return res.status(404).json({ success: false, message: 'Part not found.' });
        }

        await partsService.deletePart(id);
        return res.json({ success: true, message: 'Part removed from inventory successfully.' });
    } catch (err) {
        console.error('Delete Part Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to delete part.' });
    }
}

// Adjust stock quantity (Restock or deduct)
async function adjustStock(req, res) {
    try {
        const { id } = req.params;
        const { adjustment } = req.body;

        if (adjustment === undefined || isNaN(adjustment)) {
            return res.status(400).json({ success: false, message: 'Valid stock adjustment quantity required.' });
        }

        const part = await partsService.getPartById(id);
        if (!part) {
            return res.status(404).json({ success: false, message: 'Part not found.' });
        }

        const newQty = part.quantity + parseInt(adjustment);
        if (newQty < 0) {
            return res.status(400).json({ success: false, message: `Insufficient stock. Current stock is ${part.quantity}.` });
        }

        await partsService.updatePart(id, { quantity: newQty });
        return res.json({ success: true, message: 'Stock level updated successfully.', newQuantity: newQty });
    } catch (err) {
        console.error('Adjust Stock Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to adjust stock.' });
    }
}

module.exports = {
    getParts,
    getPartById,
    addPart,
    updatePart,
    deletePart,
    adjustStock
};
