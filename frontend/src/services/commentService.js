import api from './api';

export const commentService = {
  getTaskComments: (taskId) => api.get(`/tasks/${taskId}/comments`),
  createComment: (taskId, comment) => api.post(`/tasks/${taskId}/comments`, { comment }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};
