const express = require('express');
const router = express.Router();
const rateController = require('../controllers/rateController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(authenticateToken);

router.get('/', roleCheck(['ADMIN']), rateController.getRateCards);
router.post('/', roleCheck(['ADMIN']), rateController.createRateCard);
router.put('/:id', roleCheck(['ADMIN']), rateController.updateRateCard);

module.exports = router;