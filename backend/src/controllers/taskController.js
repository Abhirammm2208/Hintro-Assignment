const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create task
const createTask = async (req, res) => {
  try {
    const { listId, boardId, title, description } = req.body;
    const userId = req.user.id;

    if (!listId || !boardId || !title) {
      return res.status(400).json({ error: 'List ID, board ID, and title are required' });
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
      'SELECT COALESCE(MAX(position), -1) + 1 as position FROM tasks WHERE list_id = $1',
      [listId]
    );
    const position = positionResult.rows[0].position;

    const taskId = uuidv4();

    const result = await pool.query(
      'INSERT INTO tasks (id, list_id, board_id, title, description, position, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [taskId, listId, boardId, title, description || null, position, userId]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), boardId, userId, 'create', 'task', taskId, JSON.stringify(result.rows[0])]
    );

    res.status(201).json({
      ...result.rows[0],
      assigned_users: [],
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, listId, position } = req.body;
    const userId = req.user.id;

    // Get task
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const boardId = task.rows[0].board_id;

    // Check user access
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Handle task move to different list
    let updateQuery = 'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description)';
    let params = [title || null, description || null];

    if (listId !== undefined) {
      updateQuery += `, list_id = $${params.length + 1}`;
      params.push(listId);
    }

    if (position !== undefined) {
      updateQuery += `, position = $${params.length + 1}`;
      params.push(position);
    }

    updateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(updateQuery, params);

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), boardId, userId, 'update', 'task', id, JSON.stringify({ title, description, listId, position })]
    );

    // Get assigned users
    const assignedResult = await pool.query(
      `SELECT ta.id, ta.user_id, u.username FROM task_assignments ta
       INNER JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = $1`,
      [id]
    );

    res.json({
      ...result.rows[0],
      assigned_users: assignedResult.rows,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const boardId = task.rows[0].board_id;

    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [uuidv4(), boardId, userId, 'delete', 'task', id]
    );

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Assign user to task
const assignUserToTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get task
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const boardId = task.rows[0].board_id;

    // Check current user access
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, currentUserId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user exists and is board member
    const userCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User is not a board member' });
    }

    // Check if already assigned
    const existingAssignment = await pool.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ error: 'User already assigned to this task' });
    }

    const assignmentId = uuidv4();

    const result = await pool.query(
      'INSERT INTO task_assignments (id, task_id, user_id) VALUES ($1, $2, $3) RETURNING *',
      [assignmentId, id, userId]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), boardId, currentUserId, 'assign', 'task', id, JSON.stringify({ assignedUserId: userId })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning user:', error);
    res.status(500).json({ error: 'Failed to assign user' });
  }
};

// Remove user from task
const removeUserFromTask = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    const userId = req.user.id;

    // Get task
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const boardId = task.rows[0].board_id;

    // Check user access
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM task_assignments WHERE id = $1', [assignmentId]);

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), boardId, userId, 'update', 'task', id, JSON.stringify({ removedAssignment: assignmentId })]
    );

    res.json({ message: 'User removed from task' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  assignUserToTask,
  removeUserFromTask,
};
