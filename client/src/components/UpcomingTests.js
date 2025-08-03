import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Button, 
  CircularProgress,
  Grid,
  Chip,
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const CountdownTimer = ({ targetDate, onTimeReached }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft('Ready');
        setIsReady(true);
        onTimeReached();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [targetDate, onTimeReached]);

  return (
    <Typography 
      variant="body1" 
      color={isReady ? "primary" : "text.secondary"}
      fontWeight={isReady ? "bold" : "normal"}
    >
      {timeLeft}
    </Typography>
  );
};

const UpcomingTests = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [availableTests, setAvailableTests] = useState({});

  const { data: tests, isLoading, error } = useQuery(
    'upcomingTests',
    () => axios.get('http://localhost:3001/api/tests/upcoming', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).then(res => res.data),
    {
      refetchInterval: 60000 // Refetch every minute
    }
  );

  const handleTestAvailable = (testId) => {
    setAvailableTests(prev => ({
      ...prev,
      [testId]: true
    }));
  };

  const handleStartTest = (testId) => {
    navigate(`/test/${testId}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Error loading upcoming tests: {error.message}
        </Typography>
      </Box>
    );
  }

  const getStatusColor = (date) => {
    const now = new Date();
    const testDate = new Date(date);
    if (testDate <= now) return 'success';
    if (testDate.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) return 'warning';
    return 'default';
  };

  const testArray = tests?.length > 0 ? tests[0].schedule : [];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Upcoming Tests
      </Typography>

      <Grid container spacing={3}>
        {testArray?.map((test) => (
          <Grid item xs={12} md={6} key={test.id}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {test.contentType} Test
                </Typography>
                
                <Chip 
                  label={formatDistanceToNow(new Date(test.date), { addSuffix: true })}
                  color={getStatusColor(test.date)}
                  sx={{ alignSelf: 'flex-start', mb: 2 }}
                />

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Time until test:
                  </Typography>
                  <CountdownTimer 
                    targetDate={test.date}
                    onTimeReached={() => handleTestAvailable(test.id)}
                  />
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!availableTests[test.id]}
                  onClick={() => handleStartTest(test.id)}
                  sx={{ mt: 2 }}
                >
                  {availableTests[test.id] ? 'Take Test' : 'Test Not Available Yet'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}

        {tests?.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" align="center">
              No upcoming tests scheduled. Create a new test to get started!
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default UpcomingTests;