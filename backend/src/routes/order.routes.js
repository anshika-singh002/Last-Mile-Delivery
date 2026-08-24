const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middleware/auth');
const { validateOrderCreation } = require('../middleware/validation');

router.use(authenticateToken);

router.post('/preview-charge', orderController.previewCharge);
router.get('/', orderController.getAllOrders);
router.post('/', validateOrderCreation, orderController.createOrder);
router.get('/:id', orderController.getOrderDetails);
router.patch('/:id/status', orderController.updateStatus);
router.post('/:id/assign', orderController.assignAgent);
router.post('/:id/reschedule', orderController.reschedule);

module.exports = router;