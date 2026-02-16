import io from 'socket.io-client';

let socket = null;

export const connectSocket = (userId) => {
  if (socket) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socket.emit('authenticate', { userId });
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinBoard = (boardId) => {
  if (socket) {
    socket.emit('join-board', boardId);
  }
};

export const leaveBoard = (boardId) => {
  if (socket) {
    socket.emit('leave-board', boardId);
  }
};

export const onTaskCreated = (callback) => {
  if (socket) socket.on('task-created', callback);
};

export const onTaskUpdated = (callback) => {
  if (socket) socket.on('task-updated', callback);
};

export const onTaskDeleted = (callback) => {
  if (socket) socket.on('task-deleted', callback);
};

export const onTaskMoved = (callback) => {
  if (socket) socket.on('task-moved', callback);
};

export const emitTaskCreated = (data) => {
  if (socket) socket.emit('task-created', data);
};

export const emitTaskUpdated = (data) => {
  if (socket) socket.emit('task-updated', data);
};

export const emitTaskDeleted = (data) => {
  if (socket) socket.emit('task-deleted', data);
};

export const emitTaskMoved = (data) => {
  if (socket) socket.emit('task-moved', data);
};
