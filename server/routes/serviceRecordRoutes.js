const express = require('express');
const router = express.Router();
const serviceRecordController = require('../controllers/serviceRecordController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', serviceRecordController.getServiceRecords);
router.get('/:id', serviceRecordController.getServiceRecordById);
router.post('/', requireRole('ADMIN'), serviceRecordController.createServiceRecord);

module.exports = router;
