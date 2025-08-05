import React, {useEffect, useState} from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

function AdminDistractorImages() {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [contentType, setContentType] = useState('picture');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState({});

  // Fetch existing distractors
  const { data: distractorsData, isLoading } = useQuery('distractors', async () => {
    const response = await axios.get('http://localhost:3001/api/distractors', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  });

  // Upload mutation
  const uploadMutation = useMutation(
    async (formData) => {
      const response = await axios.post(
        'http://localhost:3001/api/distractors/add',
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('distractors');
        setSelectedFiles([]);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to upload images');
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async (imageId) => {
      await axios.delete(`http://localhost:3001/api/distractors/${imageId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('distractors');
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to delete image');
      },
    }
  );

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValid = contentType === 'picture' 
        ? file.type.startsWith('image/')
        : file.type.startsWith('video/');
      return isValid;
    });

    if (validFiles.length !== files.length) {
      setError(`Some files were invalid. Please only upload ${contentType}s.`);
    }

    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('distractors', file);
    });
    formData.append('contentType', contentType);
    formData.append('category', category);

    uploadMutation.mutate(formData);
  };

  const handleDelete = (imageId) => {
    if (window.confirm('Are you sure you want to delete this distractor image?')) {
      deleteMutation.mutate(imageId);
    }
  };

  // Add this effect to load authenticated images
  useEffect(() => {
    const loadImages = async () => {
      if (!distractorsData?.distractors) return;

      const urls = {};
      for (const distractor of distractorsData.distractors) {
        try {
          const response = await axios.get(
              `http://localhost:3001/api/images/${distractor.id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                responseType: 'blob'
              }
          );
          urls[distractor.id] = URL.createObjectURL(response.data);
        } catch (error) {
          console.error(`Error loading image ${distractor.id}:`, error);
        }
      }
      setImageUrls(urls);
    };

    loadImages();

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [distractorsData?.distractors]);


  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Distractor Images
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Images uploaded successfully!
          </Alert>
        )}

        <Card sx={{ mb: 4, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                label="Content Type"
              >
                <MenuItem value="picture">Picture</MenuItem>
                <MenuItem value="video">Video</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <TextField
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                variant="outlined"
              />
            </FormControl>

            <label htmlFor="contained-button-file">
              <Input
                accept={contentType === 'picture' ? 'image/*' : 'video/*'}
                id="contained-button-file"
                multiple
                type="file"
                onChange={handleFileSelect}
              />
              <Button
                variant="contained"
                component="span"
                startIcon={<AddIcon />}
              >
                Select Files
              </Button>
            </label>

            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploadMutation.isLoading}
            >
              {uploadMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : (
                'Upload'
              )}
            </Button>
          </Box>

          {selectedFiles.length > 0 && (
            <Typography variant="body2" color="textSecondary">
              {selectedFiles.length} file(s) selected
            </Typography>
          )}
        </Card>

        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {distractorsData?.distractors.map((distractor) => (
              <Grid item xs={12} sm={6} md={4} key={distractor.id}>
                <Card>
                  <CardMedia
                    component={distractor.contentType.startsWith('video') ? 'video' : 'img'}
                    src={imageUrls[distractor.id]}
                    alt={distractor.filename}
                    sx={{ height: 200, objectFit: 'cover' }}
                    controls={distractor.contentType.startsWith('video')}
                  />
                  <CardContent>
                    <Typography variant="body2" noWrap>
                      {distractor.filename}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Category: {distractor.category}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      onClick={() => handleDelete(distractor.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default AdminDistractorImages;
