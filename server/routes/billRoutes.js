const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', billController.getBills);
router.get('/:id', billController.getBillById);
router.put('/:id/status', requireRole('ADMIN'), billController.updatePaymentStatus);
router.patch('/:id/status', requireRole('ADMIN'), billController.updatePaymentStatus);
router.put('/:id/payment-status', requireRole('ADMIN'), billController.updatePaymentStatus);
router.patch('/:id/payment-status', requireRole('ADMIN'), billController.updatePaymentStatus);

module.exports = router;
