const express = require('express');
const router = express.Router();
const {
  createTask,
  updateTask,
  deleteTask,
  assignUserToTask,
  removeUserFromTask,
} = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/assign', assignUserToTask);
router.delete('/:id/assign/:assignmentId', removeUserFromTask);

module.exports = router;
