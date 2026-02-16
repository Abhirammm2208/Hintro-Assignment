const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all comments for a task
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query(
      `SELECT tc.*, u.username, u.email, u.first_name, u.last_name 
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Create a new comment
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    console.log('Creating comment:', { taskId, userId, comment });

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const result = await pool.query(
      `INSERT INTO task_comments (id, task_id, user_id, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), taskId, userId, comment.trim()]
    );

    console.log('Comment created:', result.rows[0]);

    // Fetch comment with user details
    const commentWithUser = await pool.query(
      `SELECT tc.*, u.username, u.email, u.first_name, u.last_name 
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.id = $1`,
      [result.rows[0].id]
    );

    console.log('Comment with user details:', commentWithUser.rows[0]);

    res.status(201).json(commentWithUser.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if comment exists and belongs to user
    const comment = await pool.query(
      'SELECT * FROM task_comments WHERE id = $1',
      [commentId]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await pool.query('DELETE FROM task_comments WHERE id = $1', [commentId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

module.exports = {
  getTaskComments,
  createComment,
  deleteComment,
};
