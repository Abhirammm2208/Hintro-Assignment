import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  TextField,
  Paper,
  Card,
  CardContent,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  Divider,
  Badge,
  Tooltip,
  AvatarGroup,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  History,
  PersonAdd,
  People,
  Close,
  Email,
  CheckCircle,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { boardService, listService, taskService, activityService } from '../services/api';
import { userService } from '../services/userService';
import { useBoardStore } from '../store';
import { connectSocket, joinBoard, leaveBoard, onTaskCreated, onTaskUpdated, onTaskMoved, emitTaskMoved } from '../services/socket';
import TaskCard from '../components/TaskCard';

export const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const {
    currentBoard,
    setCurrentBoard,
    lists,
    setLists,
    tasks,
    setTasks,
    members,
    setMembers,
    addList,
    deleteList: deleteListFromStore,
    addTask,
    updateTask: updateTaskInStore,
    moveTask,
  } = useBoardStore();

  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newTaskForms, setNewTaskForms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [activities, setActivities] = useState([]);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchBoardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [boardResponse, membersResponse, activitiesResponse] = await Promise.all([
        boardService.getBoardById(boardId),
        boardService.getBoardMembers(boardId),
        activityService.getActivityLogs(boardId),
      ]);

      setCurrentBoard(boardResponse.data.board);
      setLists(boardResponse.data.lists);
      setTasks(boardResponse.data.tasks);
      setMembers(membersResponse.data);
      setActivities(activitiesResponse.data.activities);
    } catch (err) {
      toast.error('Failed to load board');
      console.error('Error fetching board:', err);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, setCurrentBoard, setLists, setTasks, setMembers]);

  useEffect(() => {
    fetchBoardData();
  }, [boardId, fetchBoardData]);

  useEffect(() => {
    connectSocket();
    joinBoard(boardId);

    const unsubscribe1 = onTaskCreated((data) => {
      if (data.boardId === boardId) {
        addTask(data);
      }
    });

    const unsubscribe2 = onTaskUpdated((data) => {
      if (data.boardId === boardId) {
        updateTaskInStore(data.id, data);
      }
    });

    const unsubscribe3 = onTaskMoved((data) => {
      if (data.boardId === boardId) {
        moveTask(data.id, data.list_id, data.position);
      }
    });

    return () => {
      leaveBoard(boardId);
      unsubscribe1?.();
      unsubscribe2?.();
      unsubscribe3?.();
    };
  }, [boardId, addTask, updateTaskInStore, moveTask]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const response = await listService.createList(boardId, newListName);
      addList(response.data);
      setNewListName('');
      setShowNewListForm(false);
      toast.success('List created!');
    } catch (err) {
      toast.error('Failed to create list');
    }
  };

  const handleCreateTask = async (listId, e) => {
    e.preventDefault();
    const taskTitle = newTaskForms[listId]?.title;
    if (!taskTitle?.trim()) return;

    try {
      const response = await taskService.createTask(listId, boardId, taskTitle, '');
      addTask(response.data);
      setNewTaskForms({ ...newTaskForms, [listId]: { title: '' } });
      emitTaskMoved({ ...response.data, boardId });
      toast.success('Task created!');
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const sourceListId = source.droppableId;
    const destinationListId = destination.droppableId;

    if (sourceListId === destinationListId && source.index === destination.index) {
      return;
    }

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    moveTask(draggableId, destinationListId, destination.index);

    try {
      await taskService.updateTask(draggableId, null, null, destinationListId, destination.index);
      emitTaskMoved({
        id: draggableId,
        list_id: destinationListId,
        position: destination.index,
        boardId,
      });
    } catch (err) {
      toast.error('Failed to move task');
      moveTask(draggableId, sourceListId, source.index);
    }
  };

  const handleAddMember = async (selectedUserId) => {
    if (!selectedUserId) return;

    try {
      const user = allUsers.find(u => u.id === selectedUserId);
      await boardService.addBoardMember(boardId, user.email);
      setShowAddMemberDialog(false);
      await fetchBoardData();
      toast.success('Member added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await userService.getAllUsers();
      setAllUsers(response.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAddMemberDialog) {
      fetchAllUsers();
    }
  }, [showAddMemberDialog]);

  const handleDeleteList = async (listId) => {
    try {
      await listService.deleteList(listId);
      deleteListFromStore(listId);
      toast.success('List deleted!');
    } catch (err) {
      toast.error('Failed to delete list');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="700">
              {currentBoard?.name}
            </Typography>
            {currentBoard?.description && (
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {currentBoard.description}
              </Typography>
            )}
          </Box>

          <Tooltip title="View Members">
            <IconButton color="inherit" onClick={() => setShowMembersDialog(true)} sx={{ mr: 1 }}>
              <Badge badgeContent={members.length} color="error">
                <People />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Add Member">
            <IconButton color="inherit" onClick={() => setShowAddMemberDialog(true)} sx={{ mr: 1 }}>
              <PersonAdd />
            </IconButton>
          </Tooltip>

          <Tooltip title="Activity Log">
            <IconButton color="inherit" onClick={() => setShowActivityDrawer(true)}>
              <Badge badgeContent={activities.length} color="error">
                <History />
              </Badge>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ mt: 3, mb: 3 }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            <AnimatePresence>
              {lists.map((list) => (
                <Droppable key={list.id} droppableId={list.id}>
                  {(provided, snapshot) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <Paper
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          width: 300,
                          flexShrink: 0,
                          backgroundColor: snapshot.isDraggingOver ? '#e8eaf6' : '#ffffff',
                          borderRadius: 2,
                          transition: 'background-color 0.2s',
                        }}
                        elevation={2}
                      >
                        <Box sx={{ p: 2, borderBottom: '2px solid #f0f0f0' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="600">
                              {list.name}
                            </Typography>
                            <IconButton size="small" onClick={() => handleDeleteList(list.id)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <Box sx={{ p: 2, minHeight: 100, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                          {tasks
                            .filter((t) => t.list_id === list.id)
                            .sort((a, b) => a.position - b.position)
                            .map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <TaskCard task={task} boardId={boardId} isDragging={snapshot.isDragging} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </Box>

                        <Box sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
                          <form onSubmit={(e) => handleCreateTask(list.id, e)}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Add a card..."
                              value={newTaskForms[list.id]?.title || ''}
                              onChange={(e) =>
                                setNewTaskForms({
                                  ...newTaskForms,
                                  [list.id]: { title: e.target.value },
                                })
                              }
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton type="submit" size="small" color="primary">
                                      <Add />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </form>
                        </Box>
                      </Paper>
                    </motion.div>
                  )}
                </Droppable>
              ))}
            </AnimatePresence>

            <Box sx={{ width: 300, flexShrink: 0 }}>
              {showNewListForm ? (
                <Paper sx={{ p: 2, borderRadius: 2 }} elevation={2}>
                  <form onSubmit={handleCreateList}>
                    <TextField
                      fullWidth
                      size="small"
                      autoFocus
                      placeholder="Enter list name..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button type="submit" variant="contained" size="small" fullWidth>
                        Add List
                      </Button>
                      <IconButton size="small" onClick={() => setShowNewListForm(false)}>
                        <Close />
                      </IconButton>
                    </Box>
                  </form>
                </Paper>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setShowNewListForm(true)}
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  Add List
                </Button>
              )}
            </Box>
          </Box>
        </DragDropContext>
      </Container>

      {/* Activity Drawer */}
      <Drawer
        anchor="right"
        open={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
        PaperProps={{
          sx: { width: 400 }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="700">
              Activity Log
            </Typography>
            <IconButton onClick={() => setShowActivityDrawer(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {activities.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No activity yet
              </Typography>
            ) : (
              activities.map((activity) => (
                <ListItem key={activity.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: '0.875rem' }}>
                      {activity.username?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="600">
                        {activity.username || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ ml: 5 }}>
                    {activity.action} <strong>{activity.entity_type}</strong>
                  </Typography>
                  <Divider sx={{ mt: 2, width: '100%' }} />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Drawer>

      {/* Members Dialog */}
      <Dialog
        open={showMembersDialog}
        onClose={() => setShowMembersDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="700">
              Board Members
            </Typography>
            <IconButton onClick={() => setShowMembersDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {members.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No members yet
            </Typography>
          ) : (
            <List>
              {members.map((member) => (
                <ListItem key={member.id}>
                  <Avatar sx={{ mr: 2 }}>
                    {member.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <ListItemText
                    primary={member.username}
                    secondary={member.email}
                  />
                  <Chip
                    label={member.role || 'Member'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog
        open={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="700">
            Add Member to Board
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : allUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No users available
            </Typography>
          ) : (
            <List>
              {allUsers.map((user) => {
                const isMember = members.some(m => m.id === user.id);
                const displayName = user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user.username;
                
                return (
                  <ListItem
                    key={user.id}
                    button
                    onClick={() => !isMember && handleAddMember(user.id)}
                    disabled={isMember}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      opacity: isMember ? 0.5 : 1,
                    }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {(user.first_name?.[0] || user.username?.[0])?.toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={displayName}
                      secondary={user.email}
                    />
                    {isMember && (
                      <Chip
                        icon={<CheckCircle />}
                        label="Already Member"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAddMemberDialog(false)} variant="outlined">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Board;
