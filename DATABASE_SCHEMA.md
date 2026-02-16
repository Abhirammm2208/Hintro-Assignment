# Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema for the Task Collaboration Platform.

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │
│ username    │
│ email       │
│ password_hash
│ created_at  │
│ updated_at  │
└──────┬──────┘
       │
       │ 1─────N (owns)
       │
       ├──────────────────────┐
       │                      │
   ┌───▼────────┐         ┌───▼──────────────┐
   │   boards   │         │ board_members    │
   │────────────│         │──────────────────│
   │ id (PK)    │◄────────│ board_id (FK)    │
   │ name       │         │ user_id (FK)     │
   │ description│         │ role             │
   │ owner_id(FK)         │ created_at       │
   │ created_at │         └──────────────────┘
   │ updated_at │                │
   └─────┬──────┘                │
         │                       │
         │ 1─────N               │ 1─────N
         │                       │
    ┌────▼─────────┐         ────┘
    │    lists     │
    │──────────────│
    │ id (PK)      │
    │ board_id(FK) │
    │ name         │
    │ position     │
    │ created_at   │
    │ updated_at   │
    └────┬─────────┘
         │
         │ 1─────N
         │
    ┌────▼──────────┐          ┌──────────────────┐
    │    tasks      │◄────────┤ task_assignments │
    │───────────────│          │──────────────────│
    │ id (PK)       │ 1──N     │ id (PK)          │
    │ list_id (FK)  │          │ task_id (FK)     │
    │ board_id (FK) │          │ user_id (FK)     │
    │ title         │          │ assigned_at      │
    │ description   │          └──────────────────┘
    │ position      │                 ▲
    │ created_by(FK)│                 │
    │ created_at    │                 └─ users
    │ updated_at    │
    └───────────────┘

┌──────────────────┐
│ activity_logs    │
│──────────────────│
│ id (PK)          │
│ board_id (FK)    │
│ user_id (FK)     │
│ action           │
│ entity_type      │
│ entity_id        │
│ changes (JSONB)  │
│ created_at       │
└──────────────────┘
```

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

**Fields:**
- `id`: Unique identifier (UUID v4)
- `username`: User's display name, must be unique
- `email`: User's email, must be unique (used for login)
- `password_hash`: Bcrypt hashed password (never store plain text)
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Username and email must be unique globally
- Password hash must be minimum 60 characters (bcrypt output)

---

### boards

Represents collaborative boards where lists and tasks live.

```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_boards_owner_id ON boards(owner_id);
```

**Fields:**
- `id`: Unique identifier (UUID v4)
- `name`: Board name (required)
- `description`: Optional board description
- `owner_id`: User ID of board creator/owner
- `created_at`: Board creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Name is required
- Owner must exist in users table

---

### board_members

Junction table for many-to-many relationship between users and boards.

```sql
CREATE TABLE board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(board_id, user_id)
);

CREATE INDEX idx_board_members_board_id ON board_members(board_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
```

**Fields:**
- `id`: Unique identifier (UUID v4)
- `board_id`: Reference to boards table
- `user_id`: Reference to users table
- `role`: User's role on board ('owner' or 'member')
- `created_at`: Membership creation timestamp

**Constraints:**
- Each user can be member of a board only once (UNIQUE constraint)
- Deletion of board or user cascades to remove membership

**Roles:**
- `owner`: Can modify board, add/remove members, delete board
- `member`: Can view, create/modify tasks and lists

---

### lists

Represents columns/lists within a board.

```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lists_board_id ON lists(board_id);
```

**Fields:**
- `id`: Unique identifier (UUID v4)
- `board_id`: Reference to boards table
- `name`: List name (e.g., "To Do", "In Progress")
- `position`: Order of list within board (0 = leftmost)
- `created_at`: List creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Name is required
- Position determines display order
- Deletion of board cascades to remove lists

---

### tasks

Represents individual tasks/cards within lists.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
```

**Fields:**
- `id`: Unique identifier (UUID v4)
- `list_id`: Reference to lists table
- `board_id`: Reference to boards table (for easier querying)
- `title`: Task title (required)
- `description`: Optional task description
- `position`: Order of task within list (0 = topmost)
- `created_by`: User who created the task
- `created_at`: Task creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Title is required
- Deletion of list cascades to remove tasks
- created_by can be NULL if user is deleted (SET NULL)

**Optimization Notes:**
- Denormalized board_id for faster board-level queries
- Position allows custom ordering without sorting every time

---

### task_assignments

Junction table linking users to tasks they're assigned to.

```sql
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);
```

**Fields:**
- `id`: Unique identifier (UUID v4)
- `task_id`: Reference to tasks table
- `user_id`: Reference to users table
- `assigned_at`: When assignment was made

**Constraints:**
- User can be assigned to a task only once (UNIQUE constraint)
- Cascading delete removes assignments if task or user deleted

---

### activity_logs

Tracks all changes for audit trail and activity history.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_board_id ON activity_logs(board_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

**Fields:**
- `id`: Unique identifier (UUID v4)
- `board_id`: Reference to boards table
- `user_id`: Reference to users table (who performed action)
- `action`: Type of action performed
  - `create`: Entity created
  - `update`: Entity updated
  - `delete`: Entity deleted
  - `move`: Task moved to different list
  - `assign`: User assigned to task
- `entity_type`: Type of entity affected
  - `board`
  - `list`
  - `task`
  - `assignment`
- `entity_id`: ID of affected entity
- `changes`: JSONB data with before/after values
- `created_at`: When action occurred

**Constraints:**
- Deletion of board cascades
- user_id can be NULL if user is deleted

**JSONB Format Examples:**
```json
// Update task
{
  "title": "Old Title",
  "newTitle": "New Title",
  "description": "..."
}

// Assign user
{
  "assignedUserId": "uuid",
  "assignedUsername": "john"
}

// Move task
{
  "fromListId": "uuid",
  "toListId": "uuid",
  "position": 0
}
```

---

## Query Patterns & Performance

### Common Queries

#### Get all boards for a user
```sql
SELECT b.* FROM boards b
INNER JOIN board_members bm ON b.id = bm.board_id
WHERE bm.user_id = $1
ORDER BY b.created_at DESC;
-- Index: (board_id, user_id) on board_members
```

#### Get board with all lists and tasks
```sql
SELECT l.*, t.* FROM boards b
LEFT JOIN lists l ON b.id = l.board_id
LEFT JOIN tasks t ON l.id = t.list_id
WHERE b.id = $1
ORDER BY l.position, t.position;
-- Indexes: board_id on lists, list_id on tasks
```

#### Get tasks for user (assignments)
```sql
SELECT t.* FROM tasks t
INNER JOIN task_assignments ta ON t.id = ta.task_id
WHERE ta.user_id = $1
-- Index: user_id on task_assignments
```

#### Get activity history for board
```sql
SELECT al.* FROM activity_logs al
WHERE al.board_id = $1
ORDER BY al.created_at DESC
LIMIT 20;
-- Index: (board_id, created_at DESC) on activity_logs
```

### Index Strategy

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| users | username, email | UNIQUE | Login lookups |
| boards | owner_id | BTREE | Find user's boards |
| board_members | (board_id, user_id) | UNIQUE | Check membership |
| board_members | user_id | BTREE | Find user's boards via FK |
| lists | board_id | BTREE | Get lists for board |
| tasks | list_id | BTREE | Get tasks for list |
| tasks | board_id | BTREE | Get all tasks for board |
| tasks | created_by | BTREE | Find user's created tasks |
| task_assignments | task_id | BTREE | Get assignees for task |
| task_assignments | user_id | BTREE | Find tasks for user |
| activity_logs | (board_id, created_at DESC) | BTREE | Get recent activity |

---

## Data Validation Rules

### users
- username: 3-255 characters, alphanumeric + underscore
- email: Valid email format, unique
- password_hash: 60+ characters (bcrypt)

### boards
- name: 1-255 characters, required
- description: 0-5000 characters, optional

### lists
- name: 1-255 characters, required
- position: Non-negative integer

### tasks
- title: 1-255 characters, required
- description: 0-5000 characters, optional
- position: Non-negative integer
- list_id: Must exist and belong to correct board

### board_members
- role: Must be 'owner' or 'member'

### task_assignments
- Cannot assign non-board-member to task
- Cannot assign same user twice to same task

---

## Data Consistency & Integrity

### Referential Integrity
- All foreign keys have ON DELETE CASCADE or SET NULL
- Ensures no orphaned records

### Unique Constraints
- User cannot be added to board twice
- User cannot be assigned to task twice
- Email and username must be globally unique

### Transaction Support
- Multi-row operations wrapped in transactions
- Ensures consistency across related records

---

## Backup & Recovery Strategy

### Backup Frequency
- Full backup: Daily (overnight)
- Incremental backup: Hourly
- Retention: 30 days

### Point-in-Time Recovery
- WAL archiving enabled
- Can recover to any point within backup retention

### Testing
- Monthly restore testing to separate instance
- Verify data integrity after restore

---

## Migration Path for Evolution

If schema needs changes:

```sql
-- Add new column (backward compatible)
ALTER TABLE tasks ADD COLUMN priority INTEGER DEFAULT 0;

-- Create new index
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Rename column (requires app changes)
ALTER TABLE tasks RENAME COLUMN created_at TO created_timestamp;

-- Drop old index
DROP INDEX IF EXISTS idx_tasks_old_field;
```

### Versioning
- Schema version stored in separate table
- Allows multiple app versions to coexist temporarily
- Deprecation warnings before dropping columns
