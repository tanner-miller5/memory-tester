import React from 'react';
import { Box, Card, Typography, Grid, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {Navigate} from "react-router-dom";


const Profile = () => {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useQuery(
      ['profile', user?.id], () =>
    axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/users/${user.id}/profile`)
        .then(res => {
          console.log('Profile response:', res.data); // Debug log
          return res.data;
        })
        .catch(err => {
          console.error('Profile fetch error:', err); // Debug log
          throw err;
        }),
      {
        enabled: !!user?.id // Only run query if user.id exists
      }
  );
  if (!user) return <Navigate to="/login" />;
  if (isLoading) return <CircularProgress />;
  if (error) return <Typography color="error">Error loading profile: {error.message}</Typography>;
  if (!profile) return <Typography>No profile data available</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h5">Profile Info</Typography>
            <Typography>Username: {profile.username}</Typography>
            <Typography>Total Points: {profile.points}</Typography>
            <Typography>Tests Completed: {profile.testsCompleted}</Typography>
              <Typography>Member Since: {new Date(profile.createdAt).toLocaleDateString()}</Typography>
              <Typography>Last Updated: {new Date(profile.updatedAt).toLocaleDateString()}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h5">Recent Activity</Typography>
            {profile.recentTests.map(test => (
              <Box key={test.id} sx={{ mt: 2 }}>
                <Typography>Test Date: {new Date(test.date).toLocaleDateString()}</Typography>
                <Typography>Score: {test.score}</Typography>
                <Typography>Type: {test.contentType}</Typography>
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
