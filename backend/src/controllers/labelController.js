const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create label
const createLabel = async (req, res) => {
  try {
    const { boardId, name, color } = req.body;
    const userId = req.user.id;

    // Check board access
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'INSERT INTO labels (id, board_id, name, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), boardId, name, color]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
};

// Get labels for board
const getBoardLabels = async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;

    // Check board access
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM labels WHERE board_id = $1 ORDER BY name',
      [boardId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
};

// Update label
const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user.id;

    // Get label and check access
    const label = await pool.query('SELECT * FROM labels WHERE id = $1', [id]);
    if (label.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [label.rows[0].board_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE labels SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 RETURNING *',
      [name, color, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
};

// Delete label
const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get label and check access
    const label = await pool.query('SELECT * FROM labels WHERE id = $1', [id]);
    if (label.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [label.rows[0].board_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM labels WHERE id = $1', [id]);
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
};

// Add label to task
const addLabelToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { labelId } = req.body;
    const userId = req.user.id;

    // Get task and check access
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [task.rows[0].board_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if label exists and belongs to same board
    const label = await pool.query(
      'SELECT * FROM labels WHERE id = $1 AND board_id = $2',
      [labelId, task.rows[0].board_id]
    );

    if (label.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found or does not belong to this board' });
    }

    const result = await pool.query(
      'INSERT INTO task_labels (id, task_id, label_id) VALUES ($1, $2, $3) RETURNING *',
      [uuidv4(), taskId, labelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Label already added to task' });
    }
    console.error('Error adding label to task:', error);
    res.status(500).json({ error: 'Failed to add label to task' });
  }
};

// Remove label from task
const removeLabelFromTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.params;
    const userId = req.user.id;

    // Get task and check access
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [task.rows[0].board_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(
      'DELETE FROM task_labels WHERE task_id = $1 AND label_id = $2',
      [taskId, labelId]
    );

    res.json({ message: 'Label removed from task' });
  } catch (error) {
    console.error('Error removing label from task:', error);
    res.status(500).json({ error: 'Failed to remove label from task' });
  }
};

module.exports = {
  createLabel,
  getBoardLabels,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
};
