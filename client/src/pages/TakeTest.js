import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import TestInterface from '../components/TestInterface';

const TakeTest = () => {
  const { testId } = useParams();
  const { data: test, isLoading } = useQuery(['test', testId], () =>
    axios.get(`http://localhost:3001/api/test/${testId}`).then(res => res.data)
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TestInterface testId={testId} test={test} />
    </Box>
  );
};

export default TakeTest;
