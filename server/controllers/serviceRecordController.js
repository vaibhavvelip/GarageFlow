const serviceRecordService = require('../services/insforge/serviceRecordService');
const idMapper = require('../services/insforge/idMapper');

// Get all service records (Customer sees own vehicles, Admin sees all)
async function getServiceRecords(req, res) {
    try {
        const records = await serviceRecordService.getServiceRecords(req.user.id, req.user.role === 'ADMIN');
        return res.json({ success: true, count: records.length, serviceRecords: records });
    } catch (err) {
        console.error('Get Service Records Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve service records.' });
    }
}

// Get detailed service record by ID (including parts used and invoice summary)
async function getServiceRecordById(req, res) {
    try {
        const { id } = req.params;
        const data = await serviceRecordService.getServiceRecordById(id);
        if (!data || !data.serviceRecord) {
            return res.status(404).json({ success: false, message: 'Service record not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && data.serviceRecord.customer_id !== resolvedUid && data.serviceRecord.customer_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        return res.json({
            success: true,
            serviceRecord: data.serviceRecord,
            partsUsed: data.partsUsed || [],
            bill: data.bill || null
        });
    } catch (err) {
        console.error('Get Service Record By ID Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve service record details.' });
    }
}

// Create new Service Record (Admin/Staff only)
async function createServiceRecord(req, res) {
    try {
        const { appointment_id, service_date, mileage, service_description, technician_notes, labour_cost, parts_used } = req.body;

        if (!appointment_id || !service_date || !service_description || labour_cost === undefined) {
            return res.status(400).json({ success: false, message: 'Appointment ID, date, service description, and labour cost are required.' });
        }

        try {
            const result = await serviceRecordService.createServiceRecord({
                appointmentId: appointment_id,
                serviceDate: service_date,
                mileage,
                serviceDescription: service_description,
                technicianNotes: technician_notes,
                labourCost: labour_cost,
                partsUsed: parts_used || []
            });

            return res.status(201).json({
                success: true,
                message: 'Service record created, inventory updated, and invoice generated successfully.',
                serviceRecordId: result.record.id,
                billId: result.bill?.id,
                totalCost: result.grandTotal
            });
        } catch (serviceErr) {
            console.error('[ServiceRecordController] createServiceRecord error:', serviceErr.message);
            if (serviceErr.message && serviceErr.message.toLowerCase().includes('not found')) {
                return res.status(404).json({ success: false, message: serviceErr.message });
            }
            if (serviceErr.message && serviceErr.message.toLowerCase().includes('insufficient')) {
                return res.status(400).json({ success: false, message: serviceErr.message });
            }
            if (serviceErr.message && (serviceErr.message.toLowerCase().includes('already') || serviceErr.message.toLowerCase().includes('duplicate'))) {
                return res.status(409).json({ success: false, message: serviceErr.message });
            }
            return res.status(500).json({ success: false, message: serviceErr.message || 'Failed to create service record.' });
        }
    } catch (err) {
        console.error('Create Service Record Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to create service record.' });
    }
}

module.exports = {
    getServiceRecords,
    getServiceRecordById,
    createServiceRecord
};
