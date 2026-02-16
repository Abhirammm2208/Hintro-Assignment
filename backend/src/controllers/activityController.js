const pool = require('../db');

// Get activity logs for board
const getActivityLogs = async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check user access to board
    const memberCheck = await pool.query(
      'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT al.*, u.username FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.board_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [boardId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM activity_logs WHERE board_id = $1',
      [boardId]
    );

    res.json({
      activities: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
};

module.exports = {
  getActivityLogs,
};
