const vehicleService = require('../services/insforge/vehicleService');
const idMapper = require('../services/insforge/idMapper');
const { insforgeAdmin } = require('../services/insforge/client');

// Get all vehicles for logged-in user (Customer sees own, Admin sees all)
async function getVehicles(req, res) {
    try {
        const vehicles = await vehicleService.getVehicles(req.user.id, req.user.role === 'ADMIN');
        return res.json({ success: true, count: vehicles.length, vehicles });
    } catch (err) {
        console.error('Get Vehicles Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve vehicles.' });
    }
}

// Get single vehicle by ID
async function getVehicleById(req, res) {
    try {
        const { id } = req.params;
        const vehicle = await vehicleService.getVehicleById(id, null, true);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && vehicle.user_id !== resolvedUid && vehicle.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied to this vehicle.' });
        }

        return res.json({ success: true, vehicle });
    } catch (err) {
        console.error('Get Vehicle By ID Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve vehicle details.' });
    }
}

// Add new vehicle
async function addVehicle(req, res) {
    try {
        const { registration_number, brand, model, year, fuel_type, vehicle_type, mileage } = req.body;
        const targetUserId = (req.user.role === 'ADMIN' && req.body.user_id) ? req.body.user_id : req.user.id;

        if (!registration_number || !brand || !model || !year || !fuel_type || !vehicle_type) {
            return res.status(400).json({ success: false, message: 'Missing required vehicle fields.' });
        }

        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1900 || year > currentYear + 1) {
            return res.status(400).json({ success: false, message: `Vehicle year must be between 1900 and ${currentYear + 1}.` });
        }

        const parsedMileage = parseInt(mileage) || 0;
        if (parsedMileage < 0) {
            return res.status(400).json({ success: false, message: 'Mileage cannot be negative.' });
        }

        // Check duplicate reg number in InsForge
        const { data: existing, error: checkError } = await insforgeAdmin.database
            .from('vehicles')
            .select('id')
            .eq('registration_number', registration_number.toUpperCase())
            .limit(1);

        if (checkError) {
            throw new Error(checkError.message);
        }

        if (existing && existing.length > 0) {
            return res.status(409).json({ success: false, message: 'A vehicle with this registration number already exists.' });
        }

        const vehicle = await vehicleService.createVehicle({
            userId: targetUserId,
            registrationNumber: registration_number,
            brand,
            model,
            year,
            fuelType: fuel_type,
            vehicleType: vehicle_type,
            mileage: parsedMileage
        });

        return res.status(201).json({
            success: true,
            message: 'Vehicle registered successfully.',
            vehicleId: vehicle.id
        });
    } catch (err) {
        console.error('Add Vehicle Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to register vehicle.' });
    }
}

// Update vehicle
async function updateVehicle(req, res) {
    try {
        const { id } = req.params;
        const { brand, model, year, fuel_type, vehicle_type, mileage } = req.body;

        const vehicle = await vehicleService.getVehicleById(id, req.user.id, req.user.role === 'ADMIN');
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && vehicle.user_id !== resolvedUid && vehicle.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const updateData = {};
        if (brand !== undefined) updateData.brand = brand;
        if (model !== undefined) updateData.model = model;
        if (year !== undefined) updateData.year = parseInt(year, 10);
        if (fuel_type !== undefined) updateData.fuel_type = fuel_type;
        if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
        if (mileage !== undefined) updateData.mileage = parseInt(mileage, 10);

        await vehicleService.updateVehicle(id, req.user.id, updateData, req.user.role === 'ADMIN');
        return res.json({ success: true, message: 'Vehicle details updated successfully.' });
    } catch (err) {
        console.error('Update Vehicle Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to update vehicle.' });
    }
}

// Delete vehicle
async function deleteVehicle(req, res) {
    try {
        const { id } = req.params;

        const vehicle = await vehicleService.getVehicleById(id, req.user.id, req.user.role === 'ADMIN');
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found.' });
        }

        const resolvedUid = idMapper.resolveUserId(req.user.id);
        if (req.user.role !== 'ADMIN' && vehicle.user_id !== resolvedUid && vehicle.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        await vehicleService.deleteVehicle(id, req.user.id, req.user.role === 'ADMIN');
        return res.json({ success: true, message: 'Vehicle deleted successfully.' });
    } catch (err) {
        console.error('Delete Vehicle Error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to delete vehicle.' });
    }
}

module.exports = {
    getVehicles,
    getVehicleById,
    addVehicle,
    updateVehicle,
    deleteVehicle
};
