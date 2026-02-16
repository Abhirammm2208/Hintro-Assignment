import create from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export const useBoardStore = create((set, get) => ({
  currentBoard: null,
  boards: [],
  lists: [],
  tasks: [],
  members: [],
  isLoading: false,
  error: null,

  setCurrentBoard: (board) => set({ currentBoard: board }),
  setBoards: (boards) => set({ boards }),
  setLists: (lists) => set({ lists }),
  setTasks: (tasks) => set({ tasks }),
  setMembers: (members) => set({ members }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addBoard: (board) => {
    set((state) => ({ boards: [board, ...state.boards] }));
  },

  addList: (list) => {
    set((state) => ({ lists: [...state.lists, list] }));
  },

  updateList: (listId, updates) => {
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, ...updates } : list
      ),
    }));
  },

  deleteList: (listId) => {
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== listId),
      tasks: state.tasks.filter((task) => task.list_id !== listId),
    }));
  },

  addTask: (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }));
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  },

  moveTask: (taskId, listId, position) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, list_id: listId, position }
          : task
      ),
    }));
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },

  clear: () => {
    set({
      currentBoard: null,
      boards: [],
      lists: [],
      tasks: [],
      members: [],
    });
  },
}));
