const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.post('/', optionalAuth, quoteController.requestQuote);
router.get('/', authenticate, quoteController.getQuotes);
router.put('/:id/price', authenticate, requireAdmin, quoteController.priceQuote);
router.post('/:id/convert', authenticate, quoteController.convertQuoteToOrder);

module.exports = router;
