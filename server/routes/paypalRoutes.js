/**
 * Dezan Digitizing — PayPal API Routes
 * 
 * Secure routes for PayPal Client ID discovery, server-side order creation,
 * and server-side payment capture.
 */
const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');
const { optionalAuth } = require('../middleware/auth');

// Public route to retrieve active client ID and environment (NO SECRET)
router.get('/config', paypalController.getClientConfig);

// Server-side order creation using PAYPAL_CLIENT_SECRET
router.post('/create-order', optionalAuth, paypalController.createOrder);

// Server-side payment capture using PAYPAL_CLIENT_SECRET
router.post('/capture-order', optionalAuth, paypalController.captureOrder);

module.exports = router;
