# Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React SPA)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages: Auth, Boards, Board Detail                  │   │
│  │  Components: TaskCard, Lists, etc.                  │   │
│  │  State: Zustand (Auth, Board stores)                │   │
│  │  Services: API (axios), Socket (Socket.io-client)   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│               Backend (Express.js + Socket.io)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes: Auth, Boards, Lists, Tasks, Activities     │   │
│  │  Controllers: Business logic for each route          │   │
│  │  Middleware: Auth validation, CORS                   │   │
│  │  Socket Handler: Real-time event broadcasting       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database Layer (PostgreSQL Connection Pool)         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕ TCP
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables: users, boards, board_members               │   │
│  │          lists, tasks, task_assignments             │   │
│  │          activity_logs                              │   │
│  │  Indexes: Optimized for common queries              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App (Router)
├── Header
│   ├── Logo
│   ├── User Info
│   └── Logout Button
│
├── Login/Signup Pages
│   ├── Form Component
│   └── Auth Service Integration
│
├── Boards Page
│   ├── Board Creation Form
│   ├── Search/Filter
│   └── Board Grid
│       └── Board Cards
│
└── Board Detail Page
    ├── Board Header
    │   ├── Title & Description
    │   ├── Add Member Button
    │   └── Activity Log Toggle
    │
    ├── Main Content
    │   ├── Drag & Drop Context
    │   └── Lists (Droppable)
    │       └── Tasks (Draggable)
    │           └── TaskCard Component
    │               ├── Title
    │               ├── Description
    │               ├── Assignees
    │               └── Edit/Delete Actions
    │
    ├── Add List Section
    └── Activity Panel (Sidebar)
        └── Activity Items List
```

### State Management (Zustand)

```
Auth Store
├── user: { id, username, email }
├── token: JWT token
├── isLoading: boolean
├── error: string
├── setUser, setToken, logout, etc.

Board Store
├── currentBoard: board object
├── boards: array of boards
├── lists: array of lists
├── tasks: array of tasks
├── members: array of board members
├── isLoading, error
├── Actions:
│   ├── addBoard, updateBoard, deleteBoard
│   ├── addList, updateList, deleteList
│   ├── addTask, updateTask, moveTask, deleteTask
│   └── setters for all properties
```

### Data Flow

```
User Action (Click, Drag, Submit)
    ↓
Event Handler
    ↓
1. Optimistic State Update (if applicable)
    ↓
2. API Call (Axios)
    ↓
3. Server Processing
    ↓
4. Database Update
    ↓
5. Response Back to Client
    ↓
6. Confirm State Update or Revert on Error
    ↓
7. WebSocket Broadcast to Other Clients
    ↓
8. Other Clients Update via Socket Listener
```

## Backend Architecture

### Request Flow

```
HTTP Request / WebSocket Event
    ↓
CORS Middleware
    ↓
Auth Middleware (JWT validation)
    ↓
Route Handler
    ↓
Controller (Business Logic)
    ↓
Database Query
    ↓
Response / Event Emission
    ↓
Client Receives Data
```

### Real-time Flow

```
User Action (Frontend)
    ↓
Socket Emit Event
    ↓
Socket Handler on Server
    ↓
Database Update (if needed)
    ↓
Broadcast to Room
    ↓
All Connected Clients in Room Receive Event
    ↓
Update Local State
    ↓
Re-render UI
```

## Security Architecture

### Authentication Flow

```
Signup
├── Validate input
├── Hash password (bcrypt)
├── Create user in DB
├── Generate JWT token
└── Return token to client

Login
├── Find user by email
├── Compare password hash
├── Generate JWT token
└── Return token to client

Protected Routes
├── Extract token from header
├── Verify JWT signature
├── Decode user info
└── Proceed with request
```

### Authorization Rules

```
Board Operations
├── Only board owner can: update board, delete board
├── Board members can: view, create lists/tasks
└── Only task creator or owner can: delete task

List Operations
├── Board members can: create, update, delete lists
└── Enforced at controller level

Task Operations
├── Board members can: create, update, assign
├── Task creator can: delete
└── Any member can: view
```

## Performance Optimization

### Database Indexing Strategy

```
High-Priority Indexes:
├── users: PRIMARY KEY (id), UNIQUE (email, username)
├── boards: owner_id, FOREIGN KEY (owner_id)
├── board_members: (board_id, user_id), both as FK
├── lists: board_id, FOREIGN KEY
├── tasks: list_id, board_id, created_by
├── task_assignments: (task_id, user_id), both as FK
└── activity_logs: (board_id, created_at DESC)

Query Patterns:
├── GET /boards - Filter by user via board_members
├── GET /board/:id - Join lists and tasks by board_id
├── GET /activities - Filter by board_id, order by created_at
└── Pagination: LIMIT/OFFSET on indexed columns
```

### Frontend Performance

```
Optimization Techniques:
├── Code Splitting (lazy load pages)
├── Component Memoization (React.memo for TaskCard)
├── State Optimization (separate auth & board stores)
├── Event Debouncing (search input)
├── Optimistic Updates (instant UI feedback)
└── CSS Minimization (inline critical styles)
```

## Scalability Architecture

### Multi-Server Setup (Future)

```
Load Balancer
├── Server 1 (Express + Socket.io)
├── Server 2 (Express + Socket.io)
└── Server n (Express + Socket.io)
    ↓
    └── Redis Adapter (Socket.io communication)
    ↓
Connection Pool
    ├── PostgreSQL Primary
    ├── PostgreSQL Replicas (read-only)
    └── PgBouncer (connection pooling)
    ↓
Cache Layer (Redis)
    ├── User sessions
    ├── API responses
    └── Real-time state
```

### Database Partitioning (For Large Scale)

```
Tables to Partition by board_id:
├── Lists
├── Tasks
├── Task Assignments
└── Activity Logs

Benefits:
├── Faster queries on specific boards
├── Parallel processing
├── Easier archival/deletion
└── Better index performance
```

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Frontend: npm start (React dev server on :3000)
├── Backend: npm run dev (nodemon on :5000)
└── Database: Local PostgreSQL
```

### Production Environment (Cloud)

```
Azure App Service
├── Backend Container (Docker)
│   ├── Node.js Runtime
│   ├── Express Server
│   └── Socket.io Handler
├── Frontend Static App
│   ├── React Build
│   └── Nginx Reverse Proxy
└── Database: Azure Database for PostgreSQL

CDN: Azure Front Door
├── Frontend Assets Caching
├── API Request Routing
└── SSL/TLS Termination

Monitoring:
├── Application Insights
├── Log Analytics
└── Performance Metrics
```

## Technology Decisions & Rationale

### Why Zustand for State?
- Lightweight and simple
- No boilerplate like Redux
- Good for small to medium apps
- Easy to understand for interviews

### Why Socket.io for Real-time?
- Battle-tested library
- Works with HTTP fallback
- Room management built-in
- Simple API for events

### Why PostgreSQL?
- ACID compliance for transactions
- JSON/JSONB support for flexible data
- Excellent indexing capabilities
- Perfect for relational data (boards, lists, tasks)

### Why react-beautiful-dnd?
- Easy drag-drop integration
- Good performance
- Natural API
- Active maintenance

### Why not GraphQL?
- REST is sufficient for this project
- Simpler to implement and understand
- Less over-engineering needed
- Better for interview demonstration

## Error Handling Strategy

```
API Errors
├── 400 Bad Request: Validation errors
├── 401 Unauthorized: Missing/invalid token
├── 403 Forbidden: Insufficient permissions
├── 404 Not Found: Resource doesn't exist
└── 500 Server Error: Database/server issues

Frontend Error Handling
├── Try-catch around API calls
├── Display error messages to user
├── Log errors to console
├── Revert optimistic updates on failure
└── Graceful degradation

WebSocket Errors
├── Reconnection attempts
├── Queue events during disconnect
├── Emit failed events to server
└── User notification on connection loss
```

## Testing Strategy

### Unit Tests (Backend)
```
✓ Auth controller: signup, login, validation
✓ Board controller: CRUD operations
✓ Authorization: permission checks
✓ Database queries: correct SQL generation
✓ Utility functions: password hashing, JWT
```

### Integration Tests (Frontend)
```
✓ Auth flow: signup/login/logout
✓ Board CRUD: create, read, update, delete
✓ Task management: create, move, assign
✓ Real-time sync: WebSocket events
✓ Error scenarios: network failures, validation
```

### E2E Tests (Full Stack)
```
✓ User registration and login
✓ Board creation and collaboration
✓ Drag and drop functionality
✓ Real-time updates across tabs
✓ Activity history tracking
```
