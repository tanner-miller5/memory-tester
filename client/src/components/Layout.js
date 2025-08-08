import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const logoutButton = () => {
      logout();
      navigate('/');
  }
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Memory Tester
          </Typography>
          {user ? (
            <>
                <Button color="inherit" component={RouterLink} to="/">
                    Home
                </Button>
                <Button color="inherit" component={RouterLink} to="/leaderboard">
                    Leaderboard
                </Button>
                <Button color="inherit" component={RouterLink} to="/profile">
                    Profile
                </Button>
                <Button color="inherit" onClick={logoutButton}>
                    Logout
                </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>{children}</Box>
    </>
  );
};

export default Layout;
