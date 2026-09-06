const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { requireDigitizer } = require('../middleware/roles');

// Worker tasks - strictly authenticated for digitizer and admin roles
router.use(authenticate, requireDigitizer);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id/status', taskController.updateTaskStatus);
router.post('/:id/deliverables', taskController.uploadDeliverables);

module.exports = router;
