# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### Sign Up
Create a new user account.

**Request:**
```
POST /auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password123"
}
```

**Validations:**
- username: Required, must be unique
- email: Required, must be valid email, must be unique
- password: Required, minimum 6 characters

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
```json
// 400 Bad Request - Validation errors
{
  "error": "Missing required fields"
}

// 400 Bad Request - User exists
{
  "error": "User already exists"
}

// 400 Bad Request - Weak password
{
  "error": "Password must be at least 6 characters"
}
```

---

### Login
Authenticate and receive JWT token.

**Request:**
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
```json
// 400 Bad Request - Missing fields
{
  "error": "Email and password required"
}

// 401 Unauthorized - Invalid credentials
{
  "error": "Invalid credentials"
}
```

---

### Get Current User
Retrieve logged-in user information.

**Request:**
```
GET /auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
```json
// 401 Unauthorized - Missing token
{
  "error": "Access token required"
}

// 403 Forbidden - Invalid token
{
  "error": "Invalid or expired token"
}
```

---

## Board Endpoints

### Create Board
Create a new board.

**Request:**
```
POST /boards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Q1 Product Roadmap",
  "description": "Planning Q1 features and milestones"
}
```

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Q1 Product Roadmap",
  "description": "Planning Q1 features and milestones",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### Get All Boards
List all boards the user is member of.

**Request:**
```
GET /boards?search=&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional): Filter by board name or description (case-insensitive)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Items per page

**Response (200 OK):**
```json
{
  "boards": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Q1 Product Roadmap",
      "description": "Planning Q1 features and milestones",
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

### Get Board by ID
Retrieve board with all lists and tasks.

**Request:**
```
GET /boards/:boardId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "board": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Q1 Product Roadmap",
    "description": "Planning Q1 features and milestones",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "lists": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "board_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "To Do",
      "position": 0,
      "created_at": "2024-01-15T10:31:00Z",
      "updated_at": "2024-01-15T10:31:00Z"
    }
  ],
  "tasks": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "list_id": "770e8400-e29b-41d4-a716-446655440002",
      "board_id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Design new dashboard",
      "description": "Create mockups for new dashboard",
      "position": 0,
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:32:00Z",
      "updated_at": "2024-01-15T10:32:00Z",
      "assigned_users": [
        {
          "id": "990e8400-e29b-41d4-a716-446655440004",
          "user_id": "550e8400-e29b-41d4-a716-446655440000",
          "username": "john_doe"
        }
      ]
    }
  ]
}
```

**Error Responses:**
```json
// 403 Forbidden - Not a board member
{
  "error": "Access denied"
}

// 404 Not Found
{
  "error": "Board not found"
}
```

---

### Update Board
Update board name and description. (Owner only)

**Request:**
```
PUT /boards/:boardId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Board Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Updated Board Name",
  "description": "Updated description",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

---

### Delete Board
Delete a board and all its contents. (Owner only)

**Request:**
```
DELETE /boards/:boardId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Board deleted successfully"
}
```

---

### Add Board Member
Add a user to board by email. (Owner only)

**Request:**
```
POST /boards/:boardId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "alice@example.com"
}
```

**Response (201 Created):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "board_id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440006",
  "role": "member",
  "created_at": "2024-01-15T10:40:00Z"
}
```

**Error Responses:**
```json
// 403 Forbidden - Only owner can add
{
  "error": "Only owner can add members"
}

// 404 Not Found - User doesn't exist
{
  "error": "User not found"
}

// 400 Bad Request - Already a member
{
  "error": "User is already a board member"
}
```

---

### Get Board Members
Retrieve all members of a board.

**Request:**
```
GET /boards/:boardId/members
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "board_id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "owner",
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "aa0e8400-e29b-41d4-a716-446655440006",
    "board_id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440007",
    "role": "member",
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "2024-01-15T10:40:00Z"
  }
]
```

---

## List Endpoints

### Create List
Create a new list in a board.

**Request:**
```
POST /lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "boardId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "In Progress"
}
```

**Response (201 Created):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440010",
  "board_id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "In Progress",
  "position": 1,
  "created_at": "2024-01-15T10:45:00Z",
  "updated_at": "2024-01-15T10:45:00Z"
}
```

---

### Update List
Update list properties.

**Request:**
```
PUT /lists/:listId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Doing",
  "position": 2
}
```

**Response (200 OK):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440010",
  "board_id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Doing",
  "position": 2,
  "created_at": "2024-01-15T10:45:00Z",
  "updated_at": "2024-01-15T10:46:00Z"
}
```

---

### Delete List
Delete a list and all its tasks.

**Request:**
```
DELETE /lists/:listId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "List deleted successfully"
}
```

---

## Task Endpoints

### Create Task
Create a new task in a list.

**Request:**
```
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "listId": "770e8400-e29b-41d4-a716-446655440010",
  "boardId": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Implement authentication",
  "description": "Add JWT-based authentication to API"
}
```

**Response (201 Created):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440011",
  "list_id": "770e8400-e29b-41d4-a716-446655440010",
  "board_id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Implement authentication",
  "description": "Add JWT-based authentication to API",
  "position": 0,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:50:00Z",
  "updated_at": "2024-01-15T10:50:00Z",
  "assigned_users": []
}
```

---

### Update Task
Update task properties or move to different list.

**Request:**
```
PUT /tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "listId": "770e8400-e29b-41d4-a716-446655440012",
  "position": 1
}
```

**Response (200 OK):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440011",
  "list_id": "770e8400-e29b-41d4-a716-446655440012",
  "board_id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Updated title",
  "description": "Updated description",
  "position": 1,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:50:00Z",
  "updated_at": "2024-01-15T10:52:00Z",
  "assigned_users": []
}
```

---

### Delete Task
Delete a task.

**Request:**
```
DELETE /tasks/:taskId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Task deleted successfully"
}
```

---

### Assign User to Task
Assign a board member to a task.

**Request:**
```
POST /tasks/:taskId/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440007"
}
```

**Response (201 Created):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440012",
  "task_id": "880e8400-e29b-41d4-a716-446655440011",
  "user_id": "550e8400-e29b-41d4-a716-446655440007",
  "assigned_at": "2024-01-15T10:55:00Z"
}
```

**Error Responses:**
```json
// 404 Not Found - User not board member
{
  "error": "User is not a board member"
}

// 400 Bad Request - Already assigned
{
  "error": "User already assigned to this task"
}
```

---

### Remove User from Task
Remove a user from task assignment.

**Request:**
```
DELETE /tasks/:taskId/assign/:assignmentId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User removed from task"
}
```

---

## Activity Endpoints

### Get Activity Logs
Retrieve activity history for a board.

**Request:**
```
GET /activities/:boardId?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440013",
      "board_id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "action": "create",
      "entity_type": "task",
      "entity_id": "880e8400-e29b-41d4-a716-446655440011",
      "changes": {
        "title": "Implement authentication",
        "description": "Add JWT-based authentication to API"
      },
      "username": "john_doe",
      "created_at": "2024-01-15T10:50:00Z"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440014",
      "board_id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "action": "assign",
      "entity_type": "task",
      "entity_id": "880e8400-e29b-41d4-a716-446655440011",
      "changes": {
        "assignedUserId": "550e8400-e29b-41d4-a716-446655440007"
      },
      "username": "john_doe",
      "created_at": "2024-01-15T10:55:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid input, missing fields, validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions, not board member |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error, unexpected server issue |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- 100 requests per minute per user
- 1000 requests per hour per IP
- WebSocket message queue limits

---

## Pagination

All list endpoints support pagination:
```
GET /endpoint?page=1&limit=10
```

Responses include:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

---

## WebSocket Events

See [REALTIME.md](REALTIME.md) for detailed WebSocket event documentation.
