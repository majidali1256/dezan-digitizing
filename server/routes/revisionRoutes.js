const express = require('express');
const router = express.Router();
const revisionController = require('../controllers/revisionController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, revisionController.submitRevision);

module.exports = router;
