const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const boardRoutes = require('./src/routes/boardRoutes');
const listRoutes = require('./src/routes/listRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const labelRoutes = require('./src/routes/labelRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api', commentRoutes);
app.use('/api/labels', labelRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection handling
const userSockets = new Map(); // Maps user ID to socket IDs

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User authentication on connection
  socket.on('authenticate', (data) => {
    const userId = data.userId;
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId).push(socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  // Join board room for real-time updates
  socket.on('join-board', (boardId) => {
    socket.join(`board-${boardId}`);
    console.log(`Socket ${socket.id} joined board-${boardId}`);
  });

  // Leave board room
  socket.on('leave-board', (boardId) => {
    socket.leave(`board-${boardId}`);
  });

  // Task created event
  socket.on('task-created', (data) => {
    io.to(`board-${data.boardId}`).emit('task-created', data);
  });

  // Task updated event
  socket.on('task-updated', (data) => {
    io.to(`board-${data.boardId}`).emit('task-updated', data);
  });

  // Task deleted event
  socket.on('task-deleted', (data) => {
    io.to(`board-${data.boardId}`).emit('task-deleted', data);
  });

  // Task moved event
  socket.on('task-moved', (data) => {
    io.to(`board-${data.boardId}`).emit('task-moved', data);
  });

  // List created event
  socket.on('list-created', (data) => {
    io.to(`board-${data.boardId}`).emit('list-created', data);
  });

  // List updated event
  socket.on('list-updated', (data) => {
    io.to(`board-${data.boardId}`).emit('list-updated', data);
  });

  // List deleted event
  socket.on('list-deleted', (data) => {
    io.to(`board-${data.boardId}`).emit('list-deleted', data);
  });

  // User assigned event
  socket.on('user-assigned', (data) => {
    io.to(`board-${data.boardId}`).emit('user-assigned', data);
  });

  // Activity logged event
  socket.on('activity-logged', (data) => {
    io.to(`board-${data.boardId}`).emit('activity-logged', data);
  });

  // Comment added event
  socket.on('comment-added', (data) => {
    io.to(`board-${data.boardId}`).emit('comment-added', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Remove socket from user sockets
    for (const [userId, sockets] of userSockets.entries()) {
      const index = sockets.indexOf(socket.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          userSockets.delete(userId);
        }
      }
    }
    console.log('Client disconnected:', socket.id);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is active`);
});

module.exports = app;
