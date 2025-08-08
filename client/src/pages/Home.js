import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Instructions from "../components/Instructions";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Memory Tester, {user?.username}!
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Instructions />
      </Box>


      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Tests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upcoming memory test Schedule
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
                View Create Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a new long term memory test
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/create-test')}
              >
                Create Test
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your existing tests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View your existing long term memory tests
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/manage-tests')}
              >
                Manage Tests
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
