const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const zoneController = require('../controllers/zoneController');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const { validateOrderCreation } = require('../middleware/validation');

router.use(authenticateToken);

router.post('/preview-charge', orderController.previewCharge);
router.post('/orders', checkRole('CUSTOMER', 'ADMIN'), validateOrderCreation, orderController.createOrder);
router.get('/orders', checkRole('CUSTOMER'), orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrderDetails);
router.post('/orders/:id/reschedule', checkRole('CUSTOMER'), orderController.reschedule);
router.get('/zones', zoneController.getZones);

module.exports = router;
