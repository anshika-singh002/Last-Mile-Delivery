const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const agentController = require('../controllers/agentController');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticateToken);
router.use(checkRole('AGENT', 'ADMIN'));

router.get('/profile', agentController.getAgentProfile);
router.put('/location', agentController.updateAgentLocation);
router.get('/orders', orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrderDetails);
router.patch('/orders/:id/status', orderController.updateStatus);

module.exports = router;
