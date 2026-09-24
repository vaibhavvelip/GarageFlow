const express = require('express');
const router = express.Router();
const partController = require('../controllers/partController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', partController.getParts);
router.get('/:id', partController.getPartById);
router.post('/', requireRole('ADMIN'), partController.addPart);
router.put('/:id', requireRole('ADMIN'), partController.updatePart);
router.delete('/:id', requireRole('ADMIN'), partController.deletePart);
router.put('/:id/stock', requireRole('ADMIN'), partController.adjustStock);

module.exports = router;
