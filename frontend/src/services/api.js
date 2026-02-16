import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth service
export const authService = {
  signup: (username, email, password, firstName, lastName) =>
    apiClient.post('/auth/signup', { username, email, password, firstName, lastName }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  getCurrentUser: () =>
    apiClient.get('/auth/me'),
};

// Board service
export const boardService = {
  createBoard: (name, description) =>
    apiClient.post('/boards', { name, description }),
  getBoards: (search = '', page = 1, limit = 10) =>
    apiClient.get('/boards', { params: { search, page, limit } }),
  getBoardById: (id) =>
    apiClient.get(`/boards/${id}`),
  updateBoard: (id, name, description) =>
    apiClient.put(`/boards/${id}`, { name, description }),
  deleteBoard: (id) =>
    apiClient.delete(`/boards/${id}`),
  addBoardMember: (boardId, email) =>
    apiClient.post(`/boards/${boardId}/members`, { email }),
  getBoardMembers: (boardId) =>
    apiClient.get(`/boards/${boardId}/members`),
};

// List service
export const listService = {
  createList: (boardId, name) =>
    apiClient.post('/lists', { boardId, name }),
  updateList: (id, name, position) =>
    apiClient.put(`/lists/${id}`, { name, position }),
  deleteList: (id) =>
    apiClient.delete(`/lists/${id}`),
};

// Task service
export const taskService = {
  createTask: (listId, boardId, title, description, dueDate, priority) =>
    apiClient.post('/tasks', { listId, boardId, title, description, dueDate, priority }),
  updateTask: (id, updates) =>
    apiClient.put(`/tasks/${id}`, updates),
  deleteTask: (id) =>
    apiClient.delete(`/tasks/${id}`),
  assignUserToTask: (taskId, userId) =>
    apiClient.post(`/tasks/${taskId}/assign`, { userId }),
  removeUserFromTask: (taskId, assignmentId) =>
    apiClient.delete(`/tasks/${taskId}/assign/${assignmentId}`),
};

// Label service
export const labelService = {
  getBoardLabels: (boardId) =>
    apiClient.get(`/labels/board/${boardId}`),
  createLabel: (boardId, name, color) =>
    apiClient.post('/labels', { boardId, name, color }),
  updateLabel: (id, name, color) =>
    apiClient.put(`/labels/${id}`, { name, color }),
  deleteLabel: (id) =>
    apiClient.delete(`/labels/${id}`),
  addLabelToTask: (taskId, labelId) =>
    apiClient.post(`/labels/task/${taskId}`, { labelId }),
  removeLabelFromTask: (taskId, labelId) =>
    apiClient.delete(`/labels/task/${taskId}/${labelId}`),
};

// Activity service
export const activityService = {
  getActivityLogs: (boardId, page = 1, limit = 20) =>
    apiClient.get(`/activities/${boardId}`, { params: { page, limit } }),
};

export default apiClient;
