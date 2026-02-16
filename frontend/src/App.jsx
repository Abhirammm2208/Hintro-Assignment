import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { theme } from './theme';
import { useAuthStore } from './store';
import { authService } from './services/api';
import { connectSocket, disconnectSocket } from './services/socket';
import { Login, Signup } from './pages/Auth';
import { Boards } from './pages/Boards';
import { Board } from './pages/Board';
import ForgotPassword from './pages/ForgotPassword';

const PrivateRoute = ({ component: Component }) => {
  const { token } = useAuthStore();
  return token ? Component : <Navigate to="/login" />;
};

function App() {
  const { setUser, setToken, token } = useAuthStore();

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<PrivateRoute component={<Boards />} />} />
          <Route path="/board/:boardId" element={<PrivateRoute component={<Board />} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
