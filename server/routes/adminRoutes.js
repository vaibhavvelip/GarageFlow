const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken, requireRole('ADMIN'));

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/customers', adminController.getCustomers);
router.delete('/customers/:id', adminController.deleteCustomer);

module.exports = router;
