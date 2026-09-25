const billingService = require('../services/insforge/billingService');
const idMapper = require('../services/insforge/idMapper');

// Get all bills (Customer sees own, Admin sees all)
async function getBills(req, res) {
    try {
        const bills = await billingService.getBills(req.user.id, req.user.role === 'ADMIN');
        return res.json({ success: true, count: bills.length, bills });
    } catch (err) {
        console.error('Get Bills Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve bills.' });
    }
}

// Get detailed bill invoice by ID
async function getBillById(req, res) {
    try {
        const { id } = req.params;
        const data = await billingService.getBillById(id);
        if (!data || !data.bill) {
            return res.status(404).json({ success: false, message: 'Bill not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && data.bill.customer_id !== resolvedUid && data.bill.customer_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        return res.json({
            success: true,
            bill: data.bill,
            parts: data.parts || []
        });
    } catch (err) {
        console.error('Get Bill By ID Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve bill invoice.' });
    }
}

// Update bill payment status (Admin only)
async function updatePaymentStatus(req, res) {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        const validStatuses = ['Pending', 'Paid', 'Cancelled'];
        if (!payment_status || !validStatuses.includes(payment_status)) {
            return res.status(400).json({
                success: false,
                message: `Payment status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const data = await billingService.getBillById(id);
        if (!data || !data.bill) {
            return res.status(404).json({ success: false, message: 'Bill not found.' });
        }

        const updatedBill = await billingService.updateBillPaymentStatus(id, payment_status);
        return res.json({
            success: true,
            message: `Bill payment status updated to '${payment_status}'.`,
            bill: updatedBill
        });
    } catch (err) {
        console.error('Update Payment Status Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to update payment status.' });
    }
}

module.exports = {
    getBills,
    getBillById,
    updatePaymentStatus
};
