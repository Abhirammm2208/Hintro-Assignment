import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { authService } from './services/api';
import { connectSocket, disconnectSocket } from './services/socket';
import { Login, Signup } from './pages/Auth';
import { Boards } from './pages/Boards';
import { Board } from './pages/Board';
import './App.css';

const PrivateRoute = ({ component: Component }) => {
  const { token } = useAuthStore();
  return token ? Component : <Navigate to="/login" />;
};

function App() {
  const { user, setUser, setToken, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      authService
        .getCurrentUser()
        .then((response) => {
          setUser(response.data);
          connectSocket(response.data.id);
        })
        .catch(() => {
          setToken(null);
        });
    }

    return () => {
      disconnectSocket();
    };
  }, [token, setUser, setToken]);

  return (
    <BrowserRouter>
      <div className="app">
        {user && <Header user={user} />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<PrivateRoute component={<Boards />} />} />
          <Route path="/board/:boardId" element={<PrivateRoute component={<Board />} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const Header = ({ user }) => {
  const { logout } = useAuthStore();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="logo">📋 TaskFlow</h1>
        <div className="user-section">
          <span className="username">Hello, {user?.username}!</span>
          <button className="btn btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default App;
