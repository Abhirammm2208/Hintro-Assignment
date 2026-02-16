const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create list
const createList = async (req, res) => {
  try {
    const { boardId, name } = req.body;
    const userId = req.user.id;

    if (!boardId || !name) {
      return res.status(400).json({ error: 'Board ID and name are required' });
    }

    // Check user access to board
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get max position
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as position FROM lists WHERE board_id = $1',
      [boardId]
    );
    const position = positionResult.rows[0].position;

    const listId = uuidv4();

    const result = await pool.query(
      'INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [listId, boardId, name, position]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), boardId, userId, 'create', 'list', listId, JSON.stringify(result.rows[0])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
};

// Update list
const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position } = req.body;
    const userId = req.user.id;

    // Check user access
    const list = await pool.query('SELECT * FROM lists WHERE id = $1', [id]);
    if (list.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    const boardId = list.rows[0].board_id;

    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE lists SET name = COALESCE($1, name), position = COALESCE($2, position), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name || null, position !== undefined ? position : null, id]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), boardId, userId, 'update', 'list', id, JSON.stringify({ name, position })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: 'Failed to update list' });
  }
};

// Delete list
const deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const list = await pool.query('SELECT * FROM lists WHERE id = $1', [id]);
    if (list.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    const boardId = list.rows[0].board_id;

    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM lists WHERE id = $1', [id]);

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [uuidv4(), boardId, userId, 'delete', 'list', id]
    );

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
};

module.exports = {
  createList,
  updateList,
  deleteList,
};
