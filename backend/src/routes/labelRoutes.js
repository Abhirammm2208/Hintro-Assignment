const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createLabel,
  getBoardLabels,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
} = require('../controllers/labelController');

router.post('/', authenticateToken, createLabel);
router.get('/board/:boardId', authenticateToken, getBoardLabels);
router.put('/:id', authenticateToken, updateLabel);
router.delete('/:id', authenticateToken, deleteLabel);
router.post('/task/:taskId', authenticateToken, addLabelToTask);
router.delete('/task/:taskId/:labelId', authenticateToken, removeLabelFromTask);

module.exports = router;
