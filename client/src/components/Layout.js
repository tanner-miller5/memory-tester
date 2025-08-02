import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAdmin, logout } = useAuth();
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Memory Tester
          </Typography>
            {user?.isAdmin &&
                <Button color="inherit" component={RouterLink} to="/create-test">
                    Create Test
                </Button>
            }
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/">
                Home
              </Button>
              <Button color="inherit" component={RouterLink} to="/leaderboard">
                Leaderboard
              </Button>
                <Button color="inherit" component={RouterLink} to="/upcoming-tests">
                    Upcoming Tests
                </Button>
              <Button color="inherit" component={RouterLink} to="/profile">
                Profile
              </Button>
              <Button color="inherit" onClick={logout}>
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
