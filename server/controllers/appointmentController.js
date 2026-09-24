const appointmentService = require('../services/insforge/appointmentService');
const vehicleService = require('../services/insforge/vehicleService');
const idMapper = require('../services/insforge/idMapper');

// Valid status state machine map
const VALID_TRANSITIONS = {
    'Requested': ['Confirmed', 'Cancelled'],
    'Confirmed': ['In Service', 'Cancelled'],
    'In Service': ['Ready'],
    'Ready': ['Completed'],
    'Completed': [],
    'Cancelled': []
};

// Get all appointments (Customer sees own, Admin sees all with customer and vehicle info)
async function getAppointments(req, res) {
    try {
        const appointments = await appointmentService.getAppointments(req.user.id, req.user.role === 'ADMIN');
        return res.json({ success: true, count: appointments.length, appointments });
    } catch (err) {
        console.error('Get Appointments Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve service appointments.' });
    }
}

// Get single appointment by ID
async function getAppointmentById(req, res) {
    try {
        const { id } = req.params;
        const appointment = await appointmentService.getAppointmentById(id, null, true);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && appointment.user_id !== resolvedUid && appointment.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        return res.json({ success: true, appointment });
    } catch (err) {
        console.error('Get Appointment By ID Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve appointment details.' });
    }
}

// Book a service appointment
async function createAppointment(req, res) {
    try {
        const { vehicle_id, service_type, appointment_date, appointment_time, mileage, description } = req.body;

        if (!vehicle_id || !service_type || !appointment_date || !appointment_time) {
            return res.status(400).json({ success: false, message: 'Vehicle, service type, appointment date, and time are required.' });
        }

        // Verify vehicle exists and belongs to user (or admin)
        const vehicle = await vehicleService.getVehicleById(vehicle_id, req.user.id, req.user.role === 'ADMIN');
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Selected vehicle not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && vehicle.user_id !== resolvedUid && vehicle.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Selected vehicle does not belong to you.' });
        }

        const apptMileage = mileage ? parseInt(mileage) : vehicle.mileage;

        const appt = await appointmentService.createAppointment({
            vehicleId: vehicle.id,
            userId: vehicle.user_id,
            serviceType: service_type,
            appointmentDate: appointment_date,
            appointmentTime: appointment_time,
            mileage: apptMileage,
            description: description || ''
        });

        return res.status(201).json({
            success: true,
            message: 'Service appointment requested successfully.',
            appointmentId: appt.id
        });
    } catch (err) {
        console.error('Create Appointment Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to book service appointment.' });
    }
}

// Update appointment status (Admin & Customer cancellation)
async function updateAppointmentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'New status is required.' });
        }

        const appt = await appointmentService.getAppointmentById(id, null, true);
        if (!appt) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        // Customer can only cancel their own requested/confirmed appointments
        if (req.user.role !== 'ADMIN') {
            if (appt.user_id !== resolvedUid && appt.user_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Access denied.' });
            }
            if (status !== 'Cancelled') {
                return res.status(403).json({ success: false, message: 'Customers can only cancel appointments.' });
            }
            if (!['Requested', 'Confirmed'].includes(appt.status)) {
                return res.status(400).json({ success: false, message: `Appointment cannot be cancelled when status is '${appt.status}'.` });
            }
        } else {
            // Admin status transition validation
            const allowed = VALID_TRANSITIONS[appt.status] || [];
            if (!allowed.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition from '${appt.status}' to '${status}'. Allowed transitions: [${allowed.join(', ')}]`
                });
            }
        }

        await appointmentService.updateAppointmentStatus(id, status);
        return res.json({ success: true, message: `Appointment status updated to '${status}'.` });
    } catch (err) {
        console.error('Update Appointment Status Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to update appointment status.' });
    }
}

// Delete appointment
async function deleteAppointment(req, res) {
    try {
        const { id } = req.params;

        const appt = await appointmentService.getAppointmentById(id, null, true);
        if (!appt) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && appt.user_id !== resolvedUid && appt.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        await appointmentService.deleteAppointment(id, req.user.id, req.user.role === 'ADMIN');
        return res.json({ success: true, message: 'Appointment deleted successfully.' });
    } catch (err) {
        console.error('Delete Appointment Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to delete appointment.' });
    }
}

module.exports = {
    getAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment
};
