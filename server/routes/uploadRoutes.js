const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');

router.post('/single', optionalAuth, upload.single('file'), uploadController.uploadFile);
router.post('/multiple', optionalAuth, upload.array('files', 10), uploadController.uploadFile);

module.exports = router;
