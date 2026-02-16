const express = require('express');
const router = express.Router();
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addBoardMember,
  getBoardMembers,
} = require('../controllers/boardController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', createBoard);
router.get('/', getBoards);
router.get('/:id', getBoardById);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/members', addBoardMember);
router.get('/:id/members', getBoardMembers);

module.exports = router;
