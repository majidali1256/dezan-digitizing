const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/', healthController.checkHealth);
router.post('/test-email', healthController.testEmail);

module.exports = router;
