import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  Close,
  Send,
  Delete,
  PersonAdd,
  Edit as EditIcon,
  Event,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { commentService } from '../services/commentService';
import { taskService } from '../services/api';
import { format } from 'date-fns';

const TaskDetailDialog = ({ open, onClose, task, onTaskUpdate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dueDate, setDueDate] = useState(task?.due_date ? dayjs(task.due_date) : null);
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const commentsEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (open && task) {
      fetchComments();
    }
  }, [open, task]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await commentService.getTaskComments(task.id);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSending(true);
    try {
      console.log('Sending comment for task:', task.id, 'Comment:', newComment);
      const response = await commentService.createComment(task.id, newComment);
      console.log('Comment response:', response);
      setComments([...comments, response.data]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error sending comment:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to send comment';
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleUpdateTask = async (updates) => {
    try {
      await taskService.updateTask(task.id, updates);
      if (onTaskUpdate) {
        onTaskUpdate({ ...task, ...updates });
      }
      setHasUnsavedChanges(false);
      toast.success('Task updated!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleSaveChanges = () => {
    const updates = {};
    
    if (dueDate?.toISOString() !== task.due_date) {
      updates.dueDate = dueDate?.toISOString() || null;
    }
    
    if (priority !== task.priority) {
      updates.priority = priority;
    }

    if (Object.keys(updates).length > 0) {
      handleUpdateTask(updates);
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (task) {
      setDueDate(task.due_date ? dayjs(task.due_date) : null);
      setPriority(task.priority || 'medium');
      setHasUnsavedChanges(false);
    }
  }, [task]);

  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          height: '85vh',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: '#f5f5f5'
      }}>
        <Typography variant="body2" color="text.secondary">
          Projects / Assignments
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', height: 'calc(100% - 65px)' }}>
        {/* Left Side - Main Content */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white'
        }}>
          {/* Title */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h5" fontWeight="600" gutterBottom>
              {task.title}
            </Typography>
            
            {/* Description */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Add your description here..."
              value={task.description || ''}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                sx: { bgcolor: '#fafafa' }
              }}
            />
          </Box>

          {/* Comments Section */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No comments yet. Start the discussion!
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {comments.map((comment) => {
                  const isOwnComment = comment.user_id === currentUser.id;
                  const displayName = comment.first_name && comment.last_name
                    ? `${comment.first_name} ${comment.last_name}`
                    : comment.username;

                  return (
                    <Paper
                      key={comment.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: '#fafafa',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            width: 36, 
                            height: 36,
                          }}
                        >
                          {(comment.first_name?.[0] || comment.username?.[0])?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              {displayName}
                            </Typography>
                            {isOwnComment && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(comment.id)}
                                sx={{ ml: 1, color: 'text.secondary' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {formatDate(comment.created_at)}
                          </Typography>
                          <Typography variant="body2">
                            {comment.comment}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
                <div ref={commentsEndRef} />
              </Box>
            )}
          </Box>

          {/* Comment Input */}
          <Box
            component="form"
            onSubmit={handleSendComment}
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white',
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={sending}
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!newComment.trim() || sending}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Right Side - Details Panel */}
        <Box sx={{ 
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fafafa',
          p: 2.5,
          gap: 3
        }}>
          {/* Due Date */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Due Date
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={dueDate}
                onChange={(newValue) => {
                  setDueDate(newValue);
                  setHasUnsavedChanges(true);
                }}
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true,
                    sx: { bgcolor: 'white' }
                  } 
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Priority */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Priority
            </Typography>
            <Chip
              label={priority.charAt(0).toUpperCase() + priority.slice(1)}
              size="medium"
              sx={{
                bgcolor: priority === 'high' ? '#fee2e2' : priority === 'medium' ? '#fef3c7' : '#dbeafe',
                color: priority === 'high' ? '#991b1b' : priority === 'medium' ? '#92400e' : '#1e40af',
                fontWeight: 600,
                borderRadius: 1,
                height: 28
              }}
              onClick={(e) => {
                const newPriority = priority === 'low' ? 'medium' : priority === 'medium' ? 'high' : 'low';
                setPriority(newPriority);
                setHasUnsavedChanges(true);
              }}
            />
          </Box>

          {/* Assigned To */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Assigned To
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {task.assigned_users && task.assigned_users.length > 0 ? (
                task.assigned_users.map((user) => {
                  const displayName = user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.username;
                  return (
                    <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          width: 28, 
                          height: 28, 
                          fontSize: '0.875rem',
                          bgcolor: 'grey.400'
                        }}
                      >
                        {(user.first_name?.[0] || user.username?.[0])?.toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">
                        {displayName}
                      </Typography>
                    </Box>
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No one assigned
                </Typography>
              )}
            </Box>
          </Box>

          {/* Save Button */}
          {hasUnsavedChanges && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleSaveChanges}
              sx={{ 
                mt: 'auto',
                bgcolor: 'success.main',
                '&:hover': { bgcolor: 'success.dark' },
                textTransform: 'none'
              }}
            >
              Save Changes
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
