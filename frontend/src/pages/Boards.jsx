import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardService } from '../services/api';
import { useBoardStore, useAuthStore } from '../store';
import { motion } from 'framer-motion';
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Avatar,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  Add,
  Search,
  Dashboard as DashboardIcon,
  Logout,
  FolderOpen,
  Description,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export const Boards = () => {
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { boards, setBoards, addBoard, isLoading, setLoading } = useBoardStore();

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await boardService.getBoards(search, page);
      setBoards(response.data.boards);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, [search, page, setLoading, setBoards]);

  useEffect(() => {
    fetchBoards();
  }, [search, page, fetchBoards]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const response = await boardService.createBoard(newBoardName, newBoardDescription);
      addBoard(response.data);
      setNewBoardName('');
      setNewBoardDescription('');
      setShowNewBoardForm(false);
      toast.success('Board created successfully!');
    } catch (error) {
      console.error('Failed to create board:', error);
      toast.error('Failed to create board');
    }
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <DashboardIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Task Collaboration Platform
          </Typography>
          <Chip
            avatar={<Avatar>{user?.username?.[0]?.toUpperCase()}</Avatar>}
            label={user?.username}
            sx={{ mr: 2, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                My Boards
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your projects and collaborate with your team
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setShowNewBoardForm(true)}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                },
                px: 3,
                py: 1.5,
              }}
            >
              Create Board
            </Button>
          </Box>

          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              placeholder="Search boards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                },
              }}
            />
          </Box>
        </motion.div>

        {isLoading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Grid item xs={12} sm={6} md={4} key={n}>
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : boards.length === 0 ? (
          <Fade in>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
              }}
            >
              <FolderOpen sx={{ fontSize: 120, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" fontWeight="600" gutterBottom>
                No boards found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {search ? 'Try a different search term' : 'Create your first board to get started!'}
              </Typography>
              {!search && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => setShowNewBoardForm(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  Create First Board
                </Button>
              )}
            </Box>
          </Fade>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            <Grid container spacing={3}>
              {boards.map((board) => (
                <Grid item xs={12} sm={6} md={4} key={board.id}>
                  <motion.div variants={item}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        borderRadius: 3,
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        },
                      }}
                      onClick={() => handleBoardClick(board.id)}
                    >
                      <Box
                        sx={{
                          height: 8,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6" fontWeight="700">
                            {board.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                          {board.description || 'No description provided'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {user?.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {board.owner_id === user?.id ? 'Created by you' : 'Shared board'}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          size="small"
                          fullWidth
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        >
                          Open Board
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </Container>

      <Dialog
        open={showNewBoardForm}
        onClose={() => setShowNewBoardForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <form onSubmit={handleCreateBoard}>
          <DialogTitle>
            <Typography variant="h5" fontWeight="700">
              Create New Board
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Board Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              required
              sx={{ mb: 2, mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DashboardIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                    <Description />
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setShowNewBoardForm(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                px: 3,
              }}
            >
              Create Board
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
