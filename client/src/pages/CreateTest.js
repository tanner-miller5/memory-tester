import React, { useState } from 'react';
import { Box, Button, Container, Typography, TextField, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useMutation } from 'react-query';
import axios from 'axios';

function CreateTest() {
  const [contentType, setContentType] = useState('picture');
  const [files, setFiles] = useState([]);

  const createTest = useMutation((testData) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('content', file);
    });
    formData.append('contentType', contentType);
    
    return axios.post('http://localhost:3001/api/test/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTest.mutate();
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
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Create Test
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default CreateTest;
