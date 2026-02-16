const express = require('express');
const router = express.Router();
const { getTaskComments, createComment, deleteComment } = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

router.get('/tasks/:taskId/comments', authenticateToken, getTaskComments);
router.post('/tasks/:taskId/comments', authenticateToken, createComment);
router.delete('/comments/:commentId', authenticateToken, deleteComment);

module.exports = router;
