import React, {useEffect, useState} from 'react';
import { Box, Button, Container, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useMutation } from 'react-query';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";

function CreateTest() {
  const [contentType, setContentType] = useState('picture');
  const [files, setFiles] = useState([]);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {

  }, [isAdmin, navigate]);


  const createTest =  useMutation(
      (formData) => {
    return axios.post('http://localhost:3001/api/test/create', formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
  },
      {
        onSuccess: (response) => {
          // Navigate to the study page with the newly created test ID
          const testId = response.data.testId || response.data.id;
          navigate(`/study-test/${testId}`);
        },
        onError: (error) => {
          console.error('Error creating test:', error);
          alert('Failed to create test. Please try again.');
        }
      }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    const formData = new FormData();
    // Add files
    files.forEach(file => {
      formData.append('content', file);
    });

    // Add content type
    formData.append('contentType', contentType);

    createTest.mutate(formData);
  };




  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Memory Test
        </Typography>
        <form onSubmit={handleSubmit}>
          <RadioGroup
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            <FormControlLabel value="picture" control={<Radio />} label="Pictures" />
            <FormControlLabel value="video" control={<Radio />} label="Videos" />
          </RadioGroup>
          
          <Button
            variant="contained"
            component="label"
            sx={{ mt: 2 }}
          >
            Upload Files
            <input
              type="file"
              hidden
              multiple
              accept={contentType === 'picture' ? 'image/*' : 'video/*'}
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
          </Button>

          {files.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {files.length} file(s) selected
              </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={files.length === 0 || createTest.isLoading}
          >
            {createTest.isLoading ? 'Creating Test...' : 'Create Test'}
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default CreateTest;
