const express = require('express');
const router = express.Router();
const { createList, updateList, deleteList } = require('../controllers/listController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', createList);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

module.exports = router;
