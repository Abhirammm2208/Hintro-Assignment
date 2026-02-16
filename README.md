# Real-Time Task Collaboration Platform

A full-stack application for real-time task management and team collaboration, similar to Trello/Notion. Built with React, Node.js/Express, PostgreSQL, and Socket.io.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Real-time Features](#real-time-features)
- [Demo Credentials](#demo-credentials)
- [Deployment](#deployment)
- [Assumptions & Trade-offs](#assumptions--trade-offs)

## Features

### Core Features
- ✅ **User Authentication**: Secure signup/login with JWT tokens
- ✅ **Board Management**: Create, update, delete boards with descriptions
- ✅ **Lists & Tasks**: Organize tasks in lists within boards
- ✅ **Drag & Drop**: Drag tasks across lists with real-time synchronization
- ✅ **User Assignment**: Assign multiple users to tasks
- ✅ **Activity Tracking**: Detailed activity logs for all operations
- ✅ **Real-time Updates**: WebSocket-based live synchronization across users
- ✅ **Pagination & Search**: Search boards and filter activities
- ✅ **Team Collaboration**: Add members to boards for group work

### Technical Features
- State management with Zustand
- Responsive design (mobile-friendly)
- Error handling and validation
- Database indexing for performance
- RESTful API design
- Socket.io for real-time features

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: JWT, bcrypt
- **Validation**: Joi

### Frontend
- **UI Framework**: React 18
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Drag & Drop**: react-beautiful-dnd
- **Real-time**: Socket.io-client
- **Routing**: React Router v6

## Project Structure

```
Hintro Assignment/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── boardController.js
│   │   │   ├── listController.js
│   │   │   ├── taskController.js
│   │   │   └── activityController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── boardRoutes.js
│   │   │   ├── listRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   └── activityRoutes.js
│   │   ├── utils/
│   │   │   └── auth.js
│   │   └── db.js
│   ├── server.js
│   ├── schema.sql
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── TaskCard.jsx
│   │   ├── pages/
│   │   │   ├── Auth.jsx
│   │   │   ├── Boards.jsx
│   │   │   ├── Board.jsx
│   │   │   └── [CSS files]
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── store/
│   │   │   └── index.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── App.css
│   ├── public/
│   │   └── index.html
│   └── package.json
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb task_collaboration

   # Run schema
   psql task_collaboration < schema.sql
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - DATABASE_URL (PostgreSQL connection string)
   # - JWT_SECRET (strong random string)
   # - PORT (default 5000)
   # - FRONTEND_URL (default http://localhost:3000)
   ```

4. **Start backend server**
   ```bash
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
   echo "REACT_APP_SOCKET_URL=http://localhost:5000" >> .env
   ```

3. **Start frontend server**
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

### Verification

- Backend health check: `curl http://localhost:5000/health`
- Frontend: Open browser to `http://localhost:3000`
- Create account or use demo credentials

## API Documentation

### Authentication Endpoints

#### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: { user: {...}, token: "jwt_token" }
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: { user: {...}, token: "jwt_token" }
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Board Endpoints

#### Create Board
```
POST /api/boards
Authorization: Bearer <token>

{
  "name": "My Project",
  "description": "Project description"
}
```

#### Get All Boards
```
GET /api/boards?search=&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Board with Lists and Tasks
```
GET /api/boards/:boardId
Authorization: Bearer <token>
```

#### Update Board
```
PUT /api/boards/:boardId
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Board
```
DELETE /api/boards/:boardId
Authorization: Bearer <token>
```

#### Add Board Member
```
POST /api/boards/:boardId/members
Authorization: Bearer <token>

{
  "email": "user@example.com"
}
```

#### Get Board Members
```
GET /api/boards/:boardId/members
Authorization: Bearer <token>
```

### List Endpoints

#### Create List
```
POST /api/lists
Authorization: Bearer <token>

{
  "boardId": "board-uuid",
  "name": "To Do"
}
```

#### Update List
```
PUT /api/lists/:listId
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "position": 1
}
```

#### Delete List
```
DELETE /api/lists/:listId
Authorization: Bearer <token>
```

### Task Endpoints

#### Create Task
```
POST /api/tasks
Authorization: Bearer <token>

{
  "listId": "list-uuid",
  "boardId": "board-uuid",
  "title": "Task Title",
  "description": "Task description"
}
```

#### Update Task
```
PUT /api/tasks/:taskId
Authorization: Bearer <token>

{
  "title": "Updated Title",
  "description": "Updated description",
  "listId": "new-list-uuid",
  "position": 0
}
```

#### Delete Task
```
DELETE /api/tasks/:taskId
Authorization: Bearer <token>
```

#### Assign User to Task
```
POST /api/tasks/:taskId/assign
Authorization: Bearer <token>

{
  "userId": "user-uuid"
}
```

#### Remove User from Task
```
DELETE /api/tasks/:taskId/assign/:assignmentId
Authorization: Bearer <token>
```

### Activity Endpoints

#### Get Activity Logs
```
GET /api/activities/:boardId?page=1&limit=20
Authorization: Bearer <token>
```

## Architecture Overview

### Frontend Architecture

```
App (Router Setup)
├── Auth Pages (Login/Signup)
├── Boards List Page
└── Board Detail Page
    ├── Lists (Droppable)
    │   └── Tasks (Draggable)
    │       └── TaskCard Component
    ├── Activity Panel
    └── Add Member Modal

State Management (Zustand)
├── Auth Store (user, token)
└── Board Store (boards, lists, tasks, members)

Services
├── API Service (axios with auth)
└── Socket Service (real-time events)
```

### Backend Architecture

```
Server (Express + Socket.io)
├── Routes
│   ├── Auth Routes
│   ├── Board Routes
│   ├── List Routes
│   ├── Task Routes
│   └── Activity Routes
├── Controllers (Business Logic)
├── Middleware (Auth validation)
├── Database Connection (PostgreSQL)
└── Socket.io Handler (Real-time Events)
```

### Data Flow

1. **Synchronous Operations**
   - User action → API call → Server processes → DB update → Response → State update

2. **Real-time Operations**
   - Local state update (optimistic)
   - WebSocket event emission
   - Server broadcasts to room
   - Other clients update via WebSocket listener

## Database Schema

### Tables

#### users
```sql
- id (UUID PRIMARY KEY)
- username (VARCHAR UNIQUE)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- created_at, updated_at (TIMESTAMP)
```

#### boards
```sql
- id (UUID PRIMARY KEY)
- name, description (VARCHAR, TEXT)
- owner_id (UUID FK → users)
- created_at, updated_at (TIMESTAMP)
```

#### board_members
```sql
- id (UUID PRIMARY KEY)
- board_id, user_id (UUID FK)
- role (VARCHAR: 'owner' or 'member')
- created_at (TIMESTAMP)
- UNIQUE(board_id, user_id)
```

#### lists
```sql
- id (UUID PRIMARY KEY)
- board_id (UUID FK → boards)
- name (VARCHAR)
- position (INTEGER)
- created_at, updated_at (TIMESTAMP)
```

#### tasks
```sql
- id (UUID PRIMARY KEY)
- list_id, board_id (UUID FK)
- title, description (VARCHAR, TEXT)
- position (INTEGER)
- created_by (UUID FK → users)
- created_at, updated_at (TIMESTAMP)
```

#### task_assignments
```sql
- id (UUID PRIMARY KEY)
- task_id, user_id (UUID FK)
- assigned_at (TIMESTAMP)
- UNIQUE(task_id, user_id)
```

#### activity_logs
```sql
- id (UUID PRIMARY KEY)
- board_id, user_id (UUID FK)
- action (VARCHAR: 'create', 'update', 'delete', 'move', 'assign')
- entity_type (VARCHAR: 'board', 'list', 'task', 'assignment')
- entity_id (UUID)
- changes (JSONB)
- created_at (TIMESTAMP)
```

### Indexes
- board_id, user_id, owner_id on boards
- board_id, user_id on board_members
- board_id on lists, tasks
- task_id, user_id on task_assignments
- board_id, created_at on activity_logs
- username, email on users

## Real-time Features

### Socket.io Events

**Client to Server:**
- `authenticate`: { userId }
- `join-board`: boardId
- `leave-board`: boardId
- `task-created`: task data
- `task-updated`: task data
- `task-moved`: task data with new list_id and position
- `task-deleted`: task data
- `list-created`: list data
- `list-updated`: list data
- `list-deleted`: list data
- `user-assigned`: assignment data
- `activity-logged`: activity data

**Server to Client:**
- Same events broadcast to all users in board room

### Synchronization Strategy

1. **Optimistic Updates**: UI updates immediately, reverts on error
2. **Broadcast on Change**: Server broadcasts to all connected clients
3. **Room-based Distribution**: Only users in board room receive events
4. **Activity Logging**: Every change logged for audit trail

## Demo Credentials

### Pre-created Demo Accounts

The following demo accounts are created after initial setup:

```
Account 1:
- Email: demo@example.com
- Username: demo_user
- Password: password123

Account 2:
- Email: alice@example.com
- Username: alice
- Password: password123
```

### Test Flow

1. Login with demo@example.com / password123
2. Create a new board
3. Add alice@example.com as member
4. Create lists (To Do, In Progress, Done)
5. Add tasks and drag across lists
6. Assign tasks to users
7. View activity log
8. Open another browser/tab, login as alice to see real-time updates

## Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` environment variable
- [ ] Configure `DATABASE_URL` for production PostgreSQL
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS `origin` for production domain
- [ ] Enable HTTPS for WebSocket connections
- [ ] Setup database backups
- [ ] Configure logging aggregation
- [ ] Setup error monitoring (Sentry, etc.)
- [ ] Optimize database indexes
- [ ] Setup rate limiting
- [ ] Configure CDN for frontend assets

### Docker Deployment

Create `Dockerfile` for backend:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY server.js .
EXPOSE 5000
CMD ["npm", "start"]
```

Create `Dockerfile` for frontend:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Cloud Deployment

**Azure App Service:**
- Backend: Node.js on App Service
- Frontend: Static Web App
- Database: Azure Database for PostgreSQL
- WebSocket: Enable on App Service

**AWS:**
- Backend: EC2 or Elastic Beanstalk
- Frontend: CloudFront + S3
- Database: RDS PostgreSQL
- WebSocket: Configure through ALB or API Gateway

## Assumptions & Trade-offs

### Assumptions

1. **User Authentication**: JWT tokens stored in localStorage (frontend)
2. **Authorization**: Board members can perform operations based on role
3. **Concurrency**: Optimistic updates with server-side conflict resolution
4. **WebSocket Reliability**: Assumes stable connection, client-side retry logic not implemented
5. **Database Consistency**: SQLite not recommended for production (use PostgreSQL)

### Trade-offs

1. **Simplicity vs Features**: Skipped advanced features (labels, due dates, attachments) for core functionality
2. **Real-time vs Scalability**: Socket.io for real-time, consider Redis adapter for multi-server setup
3. **Performance vs Flexibility**: Activity logs stored as JSONB, could separate into normalized tables
4. **UI/UX vs Development Speed**: Basic styling, could enhance with CSS framework like Material-UI
5. **Security**: Basic JWT implementation, consider OAuth2/OIDC for enterprise

### Scalability Considerations

1. **Horizontal Scaling**:
   - Use Redis adapter for Socket.io across multiple servers
   - Use PostgreSQL connection pooling (PgBouncer)
   - Implement load balancer (HAProxy, AWS ALB)

2. **Database Optimization**:
   - Add indexes on frequently queried fields (already done)
   - Archive old activity logs to separate table
   - Implement query caching with Redis

3. **Frontend Optimization**:
   - Code splitting and lazy loading
   - Asset compression and CDN
   - Service worker for offline support

4. **Backend Optimization**:
   - Implement API response caching
   - Batch database operations
   - Optimize Socket.io message serialization

## Development Notes

### Common Issues & Solutions

**Issue**: WebSocket connection fails
- **Solution**: Check CORS settings, ensure Socket.io URL matches server URL

**Issue**: Real-time updates not syncing
- **Solution**: Verify user is authenticated, check browser console for errors

**Issue**: Database connection errors
- **Solution**: Verify PostgreSQL is running, check DATABASE_URL format

**Issue**: CORS errors on API calls
- **Solution**: Update CORS origin in backend server.js to match frontend URL

### Future Enhancements

1. **Features**:
   - File attachments
   - Task due dates and reminders
   - Comment threads
   - Notifications
   - Export/Import boards

2. **Technical**:
   - Unit tests with Jest
   - E2E tests with Cypress
   - GraphQL API alternative
   - Mobile app (React Native)
   - Dark mode
   - Keyboard shortcuts

## Support & Questions

For issues or questions:
1. Check the logs: `tail -f backend/logs.txt`
2. Verify environment variables are set
3. Check browser console for frontend errors
4. Review database logs

## License

MIT
