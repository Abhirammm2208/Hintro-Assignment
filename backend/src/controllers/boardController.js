const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create board
const createBoard = async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Board name is required' });
    }

    const boardId = uuidv4();

    // Create board
    const boardResult = await pool.query(
      'INSERT INTO boards (id, name, description, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [boardId, name, description || null, ownerId]
    );

    // Add owner as board member
    await pool.query(
      'INSERT INTO board_members (id, board_id, user_id, role) VALUES ($1, $2, $3, $4)',
      [uuidv4(), boardId, ownerId, 'owner']
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), boardId, ownerId, 'create', 'board', boardId, JSON.stringify(boardResult.rows[0])]
    );

    res.status(201).json(boardResult.rows[0]);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ error: 'Failed to create board' });
  }
};

// Get all boards for user
const getBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get boards where user is a member
    const result = await pool.query(
      `SELECT b.* FROM boards b
       INNER JOIN board_members bm ON b.id = bm.board_id
       WHERE bm.user_id = $1 AND (b.name ILIKE $2 OR b.description ILIKE $2)
       ORDER BY b.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, `%${search}%`, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM boards b
       INNER JOIN board_members bm ON b.id = bm.board_id
       WHERE bm.user_id = $1 AND (b.name ILIKE $2 OR b.description ILIKE $2)`,
      [userId, `%${search}%`]
    );

    res.json({
      boards: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error getting boards:', error);
    res.status(500).json({ error: 'Failed to get boards' });
  }
};

// Get board by ID with lists and tasks
const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is member of board
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get board
    const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);

    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get lists
    const listsResult = await pool.query(
      'SELECT * FROM lists WHERE board_id = $1 ORDER BY position ASC',
      [id]
    );

    // Get tasks with assignees and labels
    const tasksResult = await pool.query(
      `SELECT t.*, 
        COALESCE(json_agg(
          DISTINCT jsonb_build_object(
            'id', ta.id, 
            'user_id', ta.user_id, 
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name
          )
        ) FILTER (WHERE ta.id IS NOT NULL), '[]'::json) as assigned_users,
        COALESCE(json_agg(
          DISTINCT jsonb_build_object(
            'id', l.id,
            'name', l.name,
            'color', l.color
          )
        ) FILTER (WHERE l.id IS NOT NULL), '[]'::json) as labels
       FROM tasks t
       LEFT JOIN task_assignments ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       LEFT JOIN task_labels tl ON t.id = tl.task_id
       LEFT JOIN labels l ON tl.label_id = l.id
       WHERE t.board_id = $1 AND t.archived = FALSE
       GROUP BY t.id
       ORDER BY t.list_id, t.position ASC`,
      [id]
    );

    res.json({
      board: boardResult.rows[0],
      lists: listsResult.rows,
      tasks: tasksResult.rows,
    });
  } catch (error) {
    console.error('Error getting board:', error);
    res.status(500).json({ error: 'Failed to get board' });
  }
};

// Update board
const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check ownership
    const board = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
    if (board.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can update board' });
    }

    const result = await pool.query(
      'UPDATE boards SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), id, userId, 'update', 'board', id, JSON.stringify({ name, description })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
};

// Delete board
const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const board = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
    if (board.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can delete board' });
    }

    await pool.query('DELETE FROM boards WHERE id = $1', [id]);

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
};

// Add member to board
const addBoardMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    // Check ownership
    const board = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
    if (board.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can add members' });
    }

    // Find user by email
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const memberId = userResult.rows[0].id;

    // Check if already member
    const existingMember = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [id, memberId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a board member' });
    }

    // Add member
    const result = await pool.query(
      'INSERT INTO board_members (id, board_id, user_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), id, memberId, 'member']
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, changes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), id, userId, 'update', 'board', id, JSON.stringify({ action: 'added_member', memberId })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding board member:', error);
    res.status(500).json({ error: 'Failed to add board member' });
  }
};

// Get board members
const getBoardMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is member of board
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT bm.*, u.username, u.email FROM board_members bm
       INNER JOIN users u ON bm.user_id = u.id
       WHERE bm.board_id = $1`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting board members:', error);
    res.status(500).json({ error: 'Failed to get board members' });
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addBoardMember,
  getBoardMembers,
};
