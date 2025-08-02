import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography, CircularProgress, Box
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';

const Leaderboard = () => {
  const { data: leaderboard, isLoading} = useQuery('leaderboard', () =>
    axios.get('http://localhost:3001/api/leaderboard').then(res => res.data)
  );
  if(isLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
    );
  }
  return (
    <TableContainer component={Paper}>
      <Typography variant="h4" sx={{ p: 2 }}>
        Global Leaderboard
      </Typography>
      <Table>
        <TableHead>
          <TableRow key={`leaderboard-row-header`}>
            <TableCell>Rank</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Points</TableCell>
            <TableCell>Tests Completed</TableCell>
            <TableCell>Accuracy</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaderboard?.map((user, index) => {
            const rowKey = `leaderboard-${user.id}-${index}`;
            console.log(`rowKey-${rowKey}`);
            return (
                <TableRow key={rowKey}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.points}</TableCell>
                  <TableCell>{user.testsCompleted}</TableCell>
                  <TableCell>{user.accuracy}%</TableCell>
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Leaderboard;
