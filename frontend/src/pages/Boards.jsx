import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardService } from '../services/api';
import { useBoardStore, useAuthStore } from '../store';
import './Boards.css';

export const Boards = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { boards, setBoards, addBoard, isLoading, setLoading } = useBoardStore();

  useEffect(() => {
    fetchBoards();
  }, [search, page]);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const response = await boardService.getBoards(search, page);
      setBoards(response.data.boards);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const response = await boardService.createBoard(newBoardName, newBoardDescription);
      addBoard(response.data);
      setNewBoardName('');
      setNewBoardDescription('');
      setShowNewBoardForm(false);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  return (
    <div className="boards-container">
      <div className="boards-header">
        <h1>My Boards</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowNewBoardForm(!showNewBoardForm)}
        >
          {showNewBoardForm ? 'Cancel' : '+ New Board'}
        </button>
      </div>

      {showNewBoardForm && (
        <form className="new-board-form" onSubmit={handleCreateBoard}>
          <input
            type="text"
            placeholder="Board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newBoardDescription}
            onChange={(e) => setNewBoardDescription(e.target.value)}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              Create Board
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowNewBoardForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search boards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="boards-grid">
        {isLoading ? (
          <p className="loading">Loading boards...</p>
        ) : boards.length === 0 ? (
          <p className="no-boards">No boards found. Create your first board!</p>
        ) : (
          boards.map((board) => (
            <div
              key={board.id}
              className="board-card"
              onClick={() => handleBoardClick(board.id)}
            >
              <h3>{board.name}</h3>
              <p>{board.description || 'No description'}</p>
              <small>Created by {board.owner_id === user?.id ? 'you' : 'someone'}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
