const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const zoneController = require('../controllers/zoneController');
const rateController = require('../controllers/rateController');
const agentController = require('../controllers/agentController');
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

router.use(authenticateToken);
router.use(checkRole('ADMIN'));

router.get('/analytics', adminController.getAnalytics);

// Zone Management
router.get('/zones', zoneController.getZones);
router.post('/zones', zoneController.createZone);
router.put('/zones/:id', zoneController.updateZone);
router.delete('/zones/:id', zoneController.deleteZone);

// Rate Card Management
router.get('/rate-cards', rateController.getRateCards);
router.put('/rate-cards/:id', rateController.updateRateCard);

// Agent Management
router.get('/agents', agentController.getAllAgents);

// Order Management & Override
router.get('/orders', orderController.getAllOrders);
router.post('/orders/:id/assign', orderController.assignAgent);
router.post('/orders/:id/auto-assign', orderController.autoAssign);
router.patch('/orders/:id/status', orderController.updateStatus);

module.exports = router;
