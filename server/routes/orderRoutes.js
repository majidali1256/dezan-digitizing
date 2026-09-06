const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.post('/', optionalAuth, orderController.createOrder);
router.get('/track', orderController.trackOrder);
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.put('/:id/status', authenticate, requireAdmin, orderController.updateOrderStatus);
router.post('/:id/assign', authenticate, requireAdmin, orderController.assignDigitizer);
router.post('/:id/payment', authenticate, orderController.confirmPayment);

module.exports = router;
