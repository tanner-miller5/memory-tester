
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ManageTests = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const queryClient = useQueryClient();

  // Redirect non-admin users
  React.useEffect(() => {

  }, [isAdmin, navigate]);

  const { data: tests, isLoading } = useQuery(
    'allTests',
    () => axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tests/all`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(res => res.data)
  );

  const deleteTest = useMutation(
    (testId) => axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/test/${testId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allTests');
        setDeleteDialogOpen(false);
        setTestToDelete(null);
      }
    }
  );

  const handleDeleteClick = (test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (testToDelete) {
      deleteTest.mutate(testToDelete.id);
    }
  };

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
        Manage Tests
      </Typography>

      <Grid container spacing={3}>
        {tests?.map((test) => (
          <Grid item xs={12} sm={6} md={4} key={test.id}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {test.contentType} Test
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created: {new Date(test.createdAt).toLocaleDateString()}
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDeleteClick(test)}
                >
                  Delete
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Test</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this test? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageTests;
