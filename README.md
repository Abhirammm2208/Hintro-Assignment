# Real-Time Task Collaboration Platform

A full-stack real-time task management and collaboration platform, similar to Trello/Notion. Built with React, Node.js/Express, PostgreSQL, and Socket.io.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Abhirammm2208/Hintro-Assignment)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📚 Documentation

- **[Setup Instructions](#setup-instructions)** - Get started in 5 minutes
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Architecture Guide](ARCHITECTURE.md)** - System design and scalability
- **[Database Schema](DATABASE_SCHEMA.md)** - Database structure and relationships
- **[Demo Credentials](#demo-credentials)** - Test accounts for quick access

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Demo Credentials](#demo-credentials)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Features ✨
- 🔐 **User Authentication** - Secure JWT-based signup/login
- 📋 **Board Management** - Create and organize multiple project boards
- 📝 **Lists & Tasks** - Organize tasks in customizable lists
- 🎯 **Drag & Drop** - Move tasks between lists with real-time sync
- 👥 **Team Collaboration** - Assign team members to tasks
- 📅 **Due Dates & Priorities** - Task scheduling with priority levels (High/Medium/Low)
- 🏷️ **Labels & Tags** - Categorize tasks with colored labels
- 💬 **Comments** - Real-time discussion on tasks
- 📊 **Activity Logs** - Track all board activities
- 🔍 **Search & Filter** - Find boards and tasks quickly
- ⚡ **Real-time Updates** - Live synchronization across all users

### Technical Features 🛠️
- WebSocket real-time communication
- Responsive mobile-friendly design
- Optimistic UI updates
- Database indexing for performance
- RESTful API architecture

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- Socket.io for real-time
- JWT authentication
- bcrypt password hashing

**Frontend:**
- React 18
- Zustand state management
- Material-UI components
- react-beautiful-dnd for drag-drop
- Axios HTTP client
- Socket.io-client

---

## Quick Start

### Prerequisites
- Node.js v14+
- PostgreSQL v12+
- npm or yarn

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
---

## Quick Start

### Prerequisites
- Node.js v14+
- PostgreSQL v12+
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/Abhirammm2208/Hintro-Assignment.git
cd "Hintro Assignment"
```

### 2. Setup Database
```bash
# Create database
createdb task_collaboration

# Run schema
cd backend
psql task_collaboration < schema.sql
psql task_collaboration < schema_updates.sql

# (Optional) Seed test users
psql task_collaboration < seed_users.sql
```

### 3. Configure Backend
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://username:password@localhost:5432/task_collaboration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=5000
FRONTEND_URL=http://localhost:3000
EOF

# Start backend server
npm start
```

### 4. Configure Frontend
```bash
cd frontend
npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
EOF

# Start frontend
npm start
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

---

## Demo Credentials

Use these accounts to explore the platform:

```
Account 1:
Email: raj.sharma@example.com
Password: Password123!

Account 2:
Email: priya.patel@example.com
Password: Password123!
```

**Quick Test:**
1. Login with Account 1
2. Create a new board
3. Add priya.patel@example.com as a member
4. Create lists and tasks
5. Open incognito window, login as Account 2
6. See real-time updates! ⚡

---

## Project Structure

```
Hintro Assignment/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth middleware
│   │   └── db.js            # Database connection
│   ├── server.js            # Express server
│   ├── schema.sql           # Database schema
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API & Socket services
│   │   └── store/          # Zustand store
│   └── package.json
│
├── API_DOCUMENTATION.md     # Complete API reference
├── ARCHITECTURE.md          # System architecture
├── DATABASE_SCHEMA.md       # Database design
└── README.md
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Support

For questions or issues:
- 🐛 Issues: [GitHub Issues](https://github.com/Abhirammm2208/Hintro-Assignment/issues)

---

**Built with ❤️ using React, Node.js, PostgreSQL, and Socket.io**
