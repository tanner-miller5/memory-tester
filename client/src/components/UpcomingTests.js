import React, {useState, useEffect, useCallback} from 'react';
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

// CountdownTimer component
const CountdownTimer = ({ targetDate, onTimeReached }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    let interval;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(interval);
        onTimeReached();
        return 'Time to take the test!';
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [targetDate]); // Include dependencies

  return (
      <Typography variant="h6" component="div">
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
    () => axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tests/upcoming`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).then(res => res.data),
    {
      refetchInterval: 60000 // Refetch every minute
    }
  );

  const handleTestAvailable = useCallback((testId) => {
    setAvailableTests(prev => ({
      ...prev,
      [testId]: true
    }));
  }, []); // Memoize the callback


  const handleStartTest = (testId, scheduleId) => {
    navigate(`/take-test/${testId}/${scheduleId}`);
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

  const testObj = tests?.length > 0 ? tests[0] : {};

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Upcoming Tests
      </Typography>

      <Grid container spacing={3}>
        {testObj?.schedule?.map((scheduleObj, index, array) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {testObj?.contentType.charAt(0).toUpperCase() + testObj?.contentType.slice(1)} Test
                </Typography>
                
                <Chip 
                  label={formatDistanceToNow(new Date(scheduleObj.date), { addSuffix: true })}
                  color={getStatusColor(scheduleObj.date)}
                  sx={{ alignSelf: 'flex-start', mb: 2 }}
                />

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Time until test:
                  </Typography>
                  <CountdownTimer 
                    targetDate={scheduleObj.date}
                    onTimeReached={() => handleTestAvailable(testObj.id)}
                  />
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={scheduleObj.date > new Date().toISOString() || scheduleObj?.completed}
                  onClick={() => handleStartTest(testObj.id, scheduleObj.id)}
                  sx={{ mt: 2 }}
                >
                  {scheduleObj.date < new Date().toISOString() && !scheduleObj?.completed ? 'Take Test' : scheduleObj?.completed ?
                      `Test Completed ${scheduleObj?.answer?.correct ? 1 : 0}/1` : 'Test Not Available Yet'}
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