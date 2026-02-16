import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { boardService, listService, taskService, activityService } from '../services/api';
import { useBoardStore } from '../store';
import { connectSocket, joinBoard, leaveBoard, onTaskCreated, onTaskUpdated, onTaskMoved, emitTaskMoved } from '../services/socket';
import TaskCard from '../components/TaskCard';
import './Board.css';

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
    updateList,
    deleteList: deleteListFromStore,
    addTask,
    updateTask: updateTaskInStore,
    moveTask,
    deleteTask: deleteTaskFromStore,
  } = useBoardStore();

  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newTaskForms, setNewTaskForms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activities, setActivities] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  useEffect(() => {
    const socket = connectSocket();
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

  const fetchBoardData = async () => {
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
      setError('Failed to load board');
      console.error('Error fetching board:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const response = await listService.createList(boardId, newListName);
      addList(response.data);
      setNewListName('');
      setShowNewListForm(false);
    } catch (err) {
      setError('Failed to create list');
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
    } catch (err) {
      setError('Failed to create task');
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

    // Optimistic update
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
      setError('Failed to move task');
      // Revert on error
      moveTask(draggableId, sourceListId, source.index);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    try {
      await boardService.addBoardMember(boardId, memberEmail);
      setMemberEmail('');
      setShowAddMember(false);
      fetchBoardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;

    try {
      await listService.deleteList(listId);
      deleteListFromStore(listId);
    } catch (err) {
      setError('Failed to delete list');
    }
  };

  if (isLoading) {
    return <div className="board-container">Loading...</div>;
  }

  if (error) {
    return <div className="board-container"><div className="error">{error}</div></div>;
  }

  return (
    <div className="board-container">
      <div className="board-header">
        <div>
          <h1>{currentBoard?.name}</h1>
          <p>{currentBoard?.description}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowActivityLog(!showActivityLog)}>
            📋 Activity
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddMember(!showAddMember)}>
            👥 Add Member
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Back
          </button>
        </div>
      </div>

      {showAddMember && (
        <form className="add-member-form" onSubmit={handleAddMember}>
          <input
            type="email"
            placeholder="Email address"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-success">Add</button>
        </form>
      )}

      <div className="board-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="lists-container">
            {lists.map((list) => (
              <Droppable key={list.id} droppableId={list.id}>
                {(provided, snapshot) => (
                  <div
                    className={`list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="list-header">
                      <h3>{list.name}</h3>
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteList(list.id)}
                        title="Delete list"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="tasks-list">
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
                                className={snapshot.isDragging ? 'dragging' : ''}
                              >
                                <TaskCard task={task} boardId={boardId} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>

                    <form
                      className="new-task-form"
                      onSubmit={(e) => handleCreateTask(list.id, e)}
                    >
                      <input
                        type="text"
                        placeholder="Add a card..."
                        value={newTaskForms[list.id]?.title || ''}
                        onChange={(e) =>
                          setNewTaskForms({
                            ...newTaskForms,
                            [list.id]: { title: e.target.value },
                          })
                        }
                      />
                      <button type="submit" className="btn btn-small">
                        Add
                      </button>
                    </form>
                  </div>
                )}
              </Droppable>
            ))}

            <div className="add-list-section">
              {showNewListForm ? (
                <form className="new-list-form" onSubmit={handleCreateList}>
                  <input
                    type="text"
                    placeholder="List name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">
                      Create
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowNewListForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="btn btn-add-list"
                  onClick={() => setShowNewListForm(true)}
                >
                  + Add List
                </button>
              )}
            </div>
          </div>
        </DragDropContext>

        {showActivityLog && (
          <div className="activity-panel">
            <h3>Activity History</h3>
            <div className="activities-list">
              {activities.length === 0 ? (
                <p>No activity yet</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <small>{activity.username || 'Unknown'}</small>
                    <p>{activity.action} {activity.entity_type}</p>
                    <time>{new Date(activity.created_at).toLocaleString()}</time>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
