# Real-Time Synchronization Strategy

## Overview

This document describes how real-time synchronization is achieved across all connected clients using Socket.io WebSockets.

## Real-Time Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     Browser Tab 1                            │
│                   (User: Alice)                              │
│  ┌──────────────────────────────────┐                       │
│  │  React State                     │                       │
│  │  - Tasks, Lists, Boards          │                       │
│  └──────────────────────────────────┘                       │
│  │                      │                                   │
│  └──────┬───────────────┘                                   │
│         │ Socket.io Client                                  │
│         │ (Real-time sync)                                  │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ WebSocket Connection
          │
┌─────────┼───────────────────────────────────────────────────┐
│         │                                                    │
│         ├─────► Socket.io Server ◄──────┐                  │
│         │       (Node.js + Express)      │                  │
│         │                                │                  │
│         │  ┌────────────────────────┐    │                  │
│         │  │ Room: board-UUID       │    │                  │
│         │  │ (All connected users)  │    │                  │
│         │  └────────────────────────┘    │                  │
│         │         │        │        │    │                  │
│         └─────────┴────┬───┴────────┘    │                  │
│                        │                 │                  │
│         ┌──────────────┴─────────────────┘                  │
│         │                                                    │
│         ▼ Broadcast to All in Room                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Task Updated Event                                 │  │
│  │  - Sent to all clients in room                      │  │
│  │  - Real-time notification                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
          │
          │ WebSocket Connection
          │
┌─────────┼───────────────────────────────────────────────────┐
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────┐                  │
│  │  React State Update (Browser Tab 2)  │                  │
│  │  (User: Bob)                         │                  │
│  │  - Task reflects change              │                  │
│  │  - UI re-renders automatically       │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
│                     Browser Tab 2                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Connection Flow

### 1. Initial Connection

```javascript
// Frontend: src/services/socket.js
const socket = connectSocket(userId);
socket.emit('authenticate', { userId });
```

**What happens:**
1. Client initiates WebSocket connection
2. Server validates userId
3. Server maps socket ID to user ID
4. Connection established and ready for events

### 2. Board Join

```javascript
// Frontend: src/pages/Board.jsx
joinBoard(boardId);
```

**Server-side:**
```javascript
socket.on('join-board', (boardId) => {
  socket.join(`board-${boardId}`);
  console.log(`User joined board-${boardId}`);
});
```

**What happens:**
1. User joins specific board room
2. Only users in that room receive board events
3. Multiple tabs can join different boards

### 3. Event Broadcasting

```javascript
// Frontend: Drag task to new list
emitTaskMoved({
  id: taskId,
  list_id: newListId,
  position: newPosition,
  boardId
});
```

**Server-side:**
```javascript
socket.on('task-moved', (data) => {
  io.to(`board-${data.boardId}`).emit('task-moved', data);
  // Broadcast to all clients in room
});
```

**What happens:**
1. Event emitted from client
2. Server receives and broadcasts to room
3. All clients in room receive update
4. UI updates in real-time

## Real-Time Events

### Supported Events

#### Task Events

**task-created**
```javascript
// Emitted when new task created
{
  id: "task-uuid",
  list_id: "list-uuid",
  board_id: "board-uuid",
  title: "New Task",
  description: "Task description",
  position: 0,
  created_by: "user-uuid",
  created_at: "2024-01-15T10:50:00Z",
  assigned_users: []
}
```

**task-updated**
```javascript
// Emitted when task modified (title, description)
{
  id: "task-uuid",
  title: "Updated Title",
  description: "Updated Description",
  boardId: "board-uuid"
}
```

**task-moved**
```javascript
// Emitted when task moved to different list
{
  id: "task-uuid",
  list_id: "new-list-uuid",
  position: 2,
  boardId: "board-uuid"
}
```

**task-deleted**
```javascript
// Emitted when task removed
{
  id: "task-uuid",
  list_id: "list-uuid",
  boardId: "board-uuid"
}
```

#### List Events

**list-created**
```javascript
{
  id: "list-uuid",
  board_id: "board-uuid",
  name: "New List",
  position: 1
}
```

**list-updated**
```javascript
{
  id: "list-uuid",
  board_id: "board-uuid",
  name: "Updated List Name",
  position: 1
}
```

**list-deleted**
```javascript
{
  id: "list-uuid",
  board_id: "board-uuid"
}
```

#### User Assignment Events

**user-assigned**
```javascript
{
  id: "assignment-uuid",
  task_id: "task-uuid",
  user_id: "user-uuid",
  boardId: "board-uuid"
}
```

#### Activity Events

**activity-logged**
```javascript
{
  id: "activity-uuid",
  board_id: "board-uuid",
  user_id: "user-uuid",
  action: "create|update|delete|move|assign",
  entity_type: "board|list|task|assignment",
  entity_id: "uuid",
  changes: { ...},
  created_at: "2024-01-15T10:50:00Z"
}
```

## Synchronization Strategy

### 1. Optimistic Updates

**Pattern:**
```javascript
// Frontend: Immediately update UI
setTasks(tasks.map(t => t.id === taskId ? {...t, title: newTitle} : t));

// Send to server
await updateTask(taskId, newTitle);

// If error, revert
catch (error) {
  setTasks(tasks); // Revert to old state
}
```

**Benefits:**
- Instant UI feedback
- Better user experience
- Fast perceived performance

**Risks:**
- If server fails, state mismatch
- Need error handling
- Rollback required

### 2. Server-Driven Updates

**Pattern:**
```javascript
// Server processes and broadcasts
socket.on('task-created', async (data) => {
  // Validate
  // Save to DB
  const savedTask = await saveTask(data);
  // Broadcast to room
  io.to(`board-${data.boardId}`).emit('task-created', savedTask);
});
```

**Benefits:**
- Single source of truth
- Consistent state
- No client-side conflicts

**Considerations:**
- Slightly delayed updates
- Network latency

### 3. Event Ordering

**Challenge:** Ensure events processed in correct order across all clients

**Solution:** Timestamp-based ordering
```javascript
// Each event includes timestamp
{
  ...eventData,
  timestamp: Date.now()
}

// Client stores and sorts by timestamp
events.sort((a, b) => a.timestamp - b.timestamp);
```

### 4. Conflict Resolution

**Scenario:** Two users move same task to different lists simultaneously

**Resolution:**
```
1. Both emit task-moved events
2. Server receives both
3. Last write wins (based on timestamp)
4. Final state broadcast to all
5. All clients converge to same state
```

## Connection Resilience

### Automatic Reconnection

```javascript
// Socket.io handles reconnection by default
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

**Process:**
1. Connection lost
2. Client detects disconnection
3. Automatic retry with exponential backoff
4. On reconnection, rejoin board room
5. Resume real-time sync

### Event Queue During Disconnect

```javascript
// Queue events when disconnected
if (!socket.connected) {
  pendingEvents.push(event);
}

// Process queue on reconnect
socket.on('connect', () => {
  pendingEvents.forEach(event => {
    socket.emit(event.name, event.data);
  });
  pendingEvents = [];
});
```

## Performance Optimization

### 1. Room-Based Broadcasting

```javascript
// Only broadcast to relevant room
io.to(`board-${boardId}`).emit('task-updated', data);

// Not to all connected users
// io.emit('task-updated', data); // ❌ Inefficient
```

**Benefit:** Reduces unnecessary network traffic

### 2. Message Compression

```javascript
// Send only changed fields
{
  id: taskId,
  title: newTitle  // Only changed field
}

// Not entire object
{
  id, title, description, position, created_by, ...
} // ❌ Too much data
```

**Benefit:** Reduces payload size

### 3. Rate Limiting

```javascript
// Debounce rapid updates
const debouncedUpdate = debounce((task) => {
  emitTaskUpdated(task);
}, 500);

// On each keystroke
onChange={(e) => {
  setTitle(e.target.value);
  debouncedUpdate({...task, title: e.target.value});
}}
```

**Benefit:** Reduces server load, network traffic

### 4. Selective Updates

```javascript
// Only listen to relevant events
onTaskCreated((task) => {
  if (task.list_id === currentListId) {
    addTask(task);
  }
});

// Not all events
// onTaskCreated((task) => {
//   addTask(task); // ❌ Unnecessary state updates
// });
```

**Benefit:** Reduces re-renders, faster UI

## Real-Time Features

### 1. Live Collaborative Editing

Multiple users can:
- Edit same board
- Move tasks in real-time
- See updates instantly
- No conflicts (last write wins)

### 2. Activity Feeds

```javascript
// User sees live activity
{
  "John moved 'Design dashboard' to In Progress",
  "2 minutes ago"
}
```

### 3. Live Notifications

```javascript
// Toast notification on new mention
if (activity.action === 'assign' && activity.changes.assignedUserId === currentUserId) {
  showNotification('You were assigned to a task');
}
```

### 4. Live Presence

```javascript
// (Future enhancement)
// Show who's viewing/editing
{
  "John is viewing this board",
  "Alice is editing task X"
}
```

## Debugging Real-Time Issues

### Enable Debug Logging

```javascript
// Frontend
localStorage.debug = 'socket.io-client:*';

// Backend
process.env.DEBUG = 'socket.io:*';
```

### Monitor WebSocket Health

```javascript
// Check connection status
console.log(socket.connected);

// Listen to connection events
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('error', (error) => console.error('Socket error:', error));
```

### Test Multi-Tab Sync

1. Open board in Tab 1
2. Create task in Tab 1
3. Verify task appears in Tab 2 (same board)
4. Move task in Tab 2
5. Verify movement shows in Tab 1

### Network Throttling

```javascript
// Chrome DevTools: Network tab
// Set throttling to "Slow 3G"
// Verify events queue and process correctly
```

## Scalability Considerations

### Current Setup (Single Server)

- Works well for < 1000 concurrent users
- All events flow through single socket server
- No persistence of events

### Future: Multi-Server Setup

```javascript
// Use Redis adapter
const io = require('socket.io')(server);
const redisAdapter = require('socket.io-redis');

io.adapter(redisAdapter({
  host: 'redis-host',
  port: 6379
}));
```

**Benefits:**
- Horizontal scaling
- Server failover
- Distributed event broadcasting
- Session persistence

## Best Practices

1. **Always emit from client, validate on server**
   - Frontend: optimistic update + emit
   - Backend: validate, save, broadcast

2. **Include timestamp on all events**
   - Helps with ordering
   - Useful for debugging
   - Enables audit trails

3. **Handle disconnect gracefully**
   - Queue events
   - Show connection status
   - Auto-reconnect
   - Notify user if reconnection fails

4. **Minimize event payload**
   - Send only changed data
   - Use efficient data structures
   - Compress when necessary

5. **Test with poor network conditions**
   - Simulate latency
   - Test reconnection
   - Verify consistency

## Known Limitations

1. **No persistence across server restarts**
   - Events not stored in Redis
   - Clients reconnect but may miss history
   - Activity logs capture changes (eventual consistency)

2. **Last-write-wins conflict resolution**
   - Not suitable for conflict-heavy workloads
   - Consider CRDT for advanced use cases

3. **Memory usage on server**
   - Socket connections consume memory
   - No automatic cleanup (handled by Socket.io)
   - Monitor for memory leaks

## Future Enhancements

1. **Redis for persistence and scaling**
2. **Activity stream with eventual consistency**
3. **Operational Transformation for text conflicts**
4. **User presence/cursor tracking**
5. **Offline-first with sync**
6. **Event replay and history**
