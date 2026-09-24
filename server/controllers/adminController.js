const { insforgeAdmin } = require('../services/insforge/client');
const idMapper = require('../services/insforge/idMapper');
const appointmentService = require('../services/insforge/appointmentService');
const partsService = require('../services/insforge/partsService');

// Executive Admin Dashboard KPIs & Overview Data
async function getDashboardStats(req, res) {
    try {
        // 1. Customers
        const { data: customers, error: custError } = await insforgeAdmin.database
            .from('profiles')
            .select('id')
            .eq('role', 'CUSTOMER');

        if (custError) throw new Error(custError.message);

        // 2. Vehicles
        const { data: vehicles, error: vehError } = await insforgeAdmin.database
            .from('vehicles')
            .select('id');

        if (vehError) throw new Error(vehError.message);

        // 3. Appointments
        const { data: appts, error: apptError } = await insforgeAdmin.database
            .from('service_appointments')
            .select('*');

        if (apptError) throw new Error(apptError.message);

        const allAppts = appts || [];
        const todayStr = new Date().toISOString().split('T')[0];

        const todayCount = allAppts.filter(a => a.appointment_date === todayStr).length;
        const pendingCount = allAppts.filter(a => ['Requested', 'Confirmed'].includes(a.status)).length;
        const inServiceCount = allAppts.filter(a => a.status === 'In Service').length;
        const completedCount = allAppts.filter(a => a.status === 'Completed').length;

        // 4. Bills & Revenue
        const { data: bills, error: billError } = await insforgeAdmin.database
            .from('bills')
            .select('total, payment_status');

        if (billError) throw new Error(billError.message);

        const paidBills = (bills || []).filter(b => b.payment_status === 'Paid');
        const totalRevenue = paidBills.reduce((acc, b) => acc + parseFloat(b.total || 0), 0);

        // 5. Low stock parts
        const lowStockParts = await partsService.getLowStockParts();

        // 6. Status breakdown
        const statusMap = {};
        allAppts.forEach(a => {
            statusMap[a.status] = (statusMap[a.status] || 0) + 1;
        });
        const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

        // 7. Recent Appointments (enriched)
        const recentAppointments = await appointmentService.getAppointments(null, true);
        const top5Recent = (recentAppointments || []).slice(0, 5);

        return res.json({
            success: true,
            stats: {
                totalCustomers: (customers || []).length,
                totalVehicles: (vehicles || []).length,
                todayAppointments: todayCount,
                pendingAppointments: pendingCount,
                inServiceVehicles: inServiceCount,
                completedServices: completedCount,
                totalRevenue: totalRevenue.toFixed(2),
                lowStockCount: lowStockParts.length
            },
            lowStockParts,
            statusBreakdown,
            recentAppointments: top5Recent
        });
    } catch (err) {
        console.error('Admin Dashboard Stats Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to load dashboard metrics.' });
    }
}

// Get all Customers (Admin only, with vehicle counts)
async function getCustomers(req, res) {
    try {
        const { search } = req.query;

        let query = insforgeAdmin.database.from('profiles').select('*').eq('role', 'CUSTOMER');
        if (search && search.trim()) {
            query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
        }

        const { data: customers, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        const { data: vehicles } = await insforgeAdmin.database.from('vehicles').select('user_id');
        const vCountMap = {};
        (vehicles || []).forEach(v => {
            vCountMap[v.user_id] = (vCountMap[v.user_id] || 0) + 1;
        });

        const enrichedCustomers = (customers || []).map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            created_at: c.created_at,
            vehicle_count: vCountMap[c.id] || 0
        }));

        return res.json({ success: true, count: enrichedCustomers.length, customers: enrichedCustomers });
    } catch (err) {
        console.error('Get Customers Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve customer directory.' });
    }
}

// Delete Customer (Admin only)
async function deleteCustomer(req, res) {
    try {
        const { id } = req.params;
        const resolvedUid = idMapper.resolveUserId(id);

        const { data: customer } = await insforgeAdmin.database.from('profiles').select('*').eq('id', resolvedUid).limit(1);
        if (!customer || customer.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        await insforgeAdmin.database.from('profiles').delete().eq('id', resolvedUid);
        return res.json({ success: true, message: 'Customer account and associated records deleted.' });
    } catch (err) {
        console.error('Delete Customer Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to delete customer.' });
    }
}

module.exports = {
    getDashboardStats,
    getCustomers,
    deleteCustomer
};
