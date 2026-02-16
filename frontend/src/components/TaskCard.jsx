import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  TextField,
  Button,
  Box,
  Avatar,
  AvatarGroup,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  Edit,
  Save,
  Close,
  PersonAdd,
  CheckCircle,
  ChatBubbleOutline,
  Event,
  Label as LabelIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { taskService } from '../services/api';
import { userService } from '../services/userService';
import { useBoardStore } from '../store';
import TaskDetailDialog from './TaskDetailDialog';
import { format, isPast } from 'date-fns';

const TaskCard = ({ task, boardId, isDragging }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showAssignees, setShowAssignees] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const { updateTask: updateTaskInStore, deleteTask } = useBoardStore();

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'medium': return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'low': return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
  };

  const handleUpdateTask = async () => {
    if (!editTitle.trim()) return;

    try {
      const response = await taskService.updateTask(task.id, editTitle, editDescription);
      updateTaskInStore(task.id, response.data);
      setIsEditMode(false);
      toast.success('Task updated!');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    try {
      await taskService.deleteTask(task.id);
      deleteTask(task.id);
      toast.success('Task deleted!');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (isEditMode) {
    return (
      <Card
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
            placeholder="Task title"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description..."
          />
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={<Close />}
            onClick={() => setIsEditMode(false)}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Save />}
            onClick={handleUpdateTask}
          >
            Save
          </Button>
        </CardActions>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card
          sx={{
            mb: 2,
            borderRadius: 2,
            cursor: 'pointer',
            boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.2s',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
          onClick={() => setShowTaskDetail(true)}
        >
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="body1" fontWeight="600" sx={{ flexGrow: 1, pr: 1 }}>
                {task.title}
              </Typography>
              <Box onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => setIsEditMode(true)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={handleDeleteTask}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {task.description}
              </Typography>
            )}

            {/* Labels, Priority, Due Date */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {task.labels && task.labels.length > 0 && task.labels.map(label => (
                <Chip
                  key={label.id}
                  label={label.name}
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.7rem',
                    bgcolor: label.color,
                    color: '#fff',
                  }}
                />
              ))}
              {task.priority && (
                <Chip
                  label={task.priority.toUpperCase()}
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    bgcolor: getPriorityColor(task.priority).bg,
                    color: getPriorityColor(task.priority).text,
                    border: `1px solid ${getPriorityColor(task.priority).border}`,
                  }}
                />
              )}
              {task.due_date && (
                <Chip
                  icon={<Event sx={{ fontSize: '0.8rem' }} />}
                  label={format(new Date(task.due_date), 'MMM d')}
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.7rem',
                    bgcolor: isPast(new Date(task.due_date)) && !task.archived ? '#fee2e2' : '#f3f4f6',
                    color: isPast(new Date(task.due_date)) && !task.archived ? '#991b1b' : '#374151',
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {task.assigned_users && task.assigned_users.length > 0 ? (
                  <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
                    {task.assigned_users.map((user) => (
                      <Tooltip key={user.id} title={user.username}>
                        <Avatar>
                          {user.username[0].toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                ) : (
                  <Box />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Comments">
                  <IconButton size="small" color="default">
                    <ChatBubbleOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Assign members">
                  <IconButton size="small" color="primary" onClick={() => setShowAssignees(true)}>
                    <PersonAdd fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      <TaskDetailDialog
        open={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        task={task}
        onTaskUpdate={(updatedTask) => updateTaskInStore(task.id, updatedTask)}
      />

      <AssigneeSelector
        task={task}
        open={showAssignees}
        onClose={() => setShowAssignees(false)}
      />
    </>
  );
};

const AssigneeSelector = ({ task, open, onClose }) => {
  const { members, tasks } = useBoardStore();
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAllUsers();
    }
  }, [open]);

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

  const handleAssign = async (userId) => {
    try {
      await taskService.assignUserToTask(task.id, userId);
      toast.success('Member assigned!');
      onClose();
      window.location.reload(); // Refresh to show updated assignments
    } catch (error) {
      console.error('Failed to assign user:', error);
      toast.error('Failed to assign member');
    }
  };

  const assignedUserIds = (task.assigned_users || []).map((u) => u.user_id || u.id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="700">
            Assign Members
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : allUsers.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
            No users available
          </Typography>
        ) : (
          <List>
            {allUsers.map((user) => {
              const isAssigned = assignedUserIds.includes(user.id);
              const displayName = user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.username;
              
              return (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => handleAssign(user.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    backgroundColor: isAssigned ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isAssigned ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {(user.first_name?.[0] || user.username?.[0])?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={displayName}
                    secondary={user.email}
                  />
                  {isAssigned && (
                    <CheckCircle color="primary" />
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskCard;
