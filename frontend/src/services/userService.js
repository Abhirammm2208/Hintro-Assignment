import api from './api';

export const userService = {
  getAllUsers: () => api.get('/auth/users'),
};
