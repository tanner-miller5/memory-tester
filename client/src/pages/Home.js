import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Memory Tester, {user?.username}!
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Tests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upcoming memory test with pictures or videos
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/upcoming-tests')}
              >
                Upcoming Tests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                View Leaderboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                See how you rank against other users
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/leaderboard')}
              >
                View Leaderboard
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View your progress and test history
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/profile')}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
