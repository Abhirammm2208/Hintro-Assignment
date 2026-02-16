import React, { useState } from 'react';
import { taskService } from '../services/api';
import { useBoardStore } from '../store';
import './TaskCard.css';

const TaskCard = ({ task, boardId }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showAssignees, setShowAssignees] = useState(false);
  const { updateTask: updateTaskInStore, deleteTask } = useBoardStore();

  const handleUpdateTask = async () => {
    if (!editTitle.trim()) return;

    try {
      const response = await taskService.updateTask(task.id, editTitle, editDescription);
      updateTaskInStore(task.id, response.data);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await taskService.deleteTask(task.id);
      deleteTask(task.id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (isEditMode) {
    return (
      <div className="task-card edit-mode">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description..."
        />
        <div className="edit-actions">
          <button className="btn btn-small btn-success" onClick={handleUpdateTask}>
            Save
          </button>
          <button
            className="btn btn-small btn-secondary"
            onClick={() => setIsEditMode(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-card">
      <div className="task-header">
        <h4 onClick={() => setIsEditMode(true)}>{task.title}</h4>
        <button className="btn-icon" onClick={handleDeleteTask}>
          ✕
        </button>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-footer">
        <div className="assignees">
          {task.assigned_users && task.assigned_users.length > 0 ? (
            <div className="assignee-list">
              {task.assigned_users.map((user) => (
                <span key={user.id} className="assignee-badge">
                  {user.username[0].toUpperCase()}
                </span>
              ))}
            </div>
          ) : (
            <button
              className="btn-assign"
              onClick={() => setShowAssignees(!showAssignees)}
            >
              Assign
            </button>
          )}
        </div>
      </div>

      {showAssignees && (
        <AssigneeSelector task={task} onClose={() => setShowAssignees(false)} />
      )}
    </div>
  );
};

const AssigneeSelector = ({ task, onClose }) => {
  const { members, tasks } = useBoardStore();

  const handleAssign = async (memberId) => {
    try {
      await taskService.assignUserToTask(task.id, memberId);
      const updatedTask = tasks.find((t) => t.id === task.id);
      if (updatedTask) {
        const response = await taskService.updateTask(task.id);
        onClose();
      }
    } catch (error) {
      console.error('Failed to assign user:', error);
    }
  };

  const assignedUserIds = (task.assigned_users || []).map((u) => u.user_id);

  return (
    <div className="assignee-selector">
      <h5>Assign to:</h5>
      <div className="member-list">
        {members.map((member) => (
          <button
            key={member.id}
            className={`member-btn ${
              assignedUserIds.includes(member.user_id) ? 'assigned' : ''
            }`}
            onClick={() => handleAssign(member.user_id)}
          >
            {member.username}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TaskCard;
