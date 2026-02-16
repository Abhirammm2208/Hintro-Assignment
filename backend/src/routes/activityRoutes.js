const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/:boardId', getActivityLogs);

module.exports = router;
