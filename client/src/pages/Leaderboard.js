import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';

const Leaderboard = () => {
  const { data: leaderboardData, isLoading } = useQuery('leaderboard', () =>
      axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/leaderboard`).then(res => res.data)
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Tests Completed</TableCell>
              <TableCell>Average Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboardData?.map((user, index) => (
              <TableRow 
                key={user._id}
                sx={index < 3 ? { backgroundColor: index === 0 ? '#ffd70020' : index === 1 ? '#c0c0c020' : '#cd7f3220' } : {}}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.totalScore}</TableCell>
                <TableCell>{user.testsCompleted}</TableCell>
                <TableCell>{`${Math.round(user.averageTime)}s`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {(!leaderboardData || leaderboardData.length === 0) && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No leaderboard data available yet.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Leaderboard;
