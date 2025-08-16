
import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardMedia,
    Button,
    CircularProgress,
    Alert,
    Grid,
    Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import axios from 'axios';

function StudyTest() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [imageUrls, setImageUrls] = useState({});

    // Fetch test data
    const { data: testData, isLoading, error } = useQuery(
        ['test', testId],
        async () => {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/test/${testId}`,
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }
            );
            return response.data;
        }
    );

    // Load images with authentication
    const loadAuthenticatedImage = async (imageId) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/images/${imageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    responseType: 'blob'
                }
            );
            const contentType = response.headers['content-type'];
            const blob = new Blob([response.data], { type: contentType });
            return {
                url: URL.createObjectURL(blob),
                contentType: contentType
            };
        } catch (error) {
            console.error('Error loading image:', error);
            return null;
        }
    };

    // Load all media when testData is available
    useEffect(() => {
        if (testData?.schedule) {
            const loadAllMedia = async () => {
                const mediaPromises = testData.schedule.map(async (scheduleItem) => {
                    if (scheduleItem.imageId) {
                        const result = await loadAuthenticatedImage(scheduleItem.imageId);
                        return { imageId: scheduleItem.imageId, result };
                    }
                    return null;
                });

                const mediaResults = await Promise.all(mediaPromises);
                const newImageUrls = {};
                mediaResults.forEach(({ imageId, result }) => {
                    if (result && imageId) {
                        newImageUrls[imageId] = result;
                    }
                });

                setImageUrls(newImageUrls);
            };

            loadAllMedia();
        }

        return () => {
            // Cleanup blob URLs
            Object.values(imageUrls).forEach(media => {
                if (media?.url) URL.revokeObjectURL(media.url);
            });
        };
    }, [testData?.schedule]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error">
                    {error.response?.data?.error || 'Failed to load test. Please try again later.'}
                </Alert>
            </Container>
        );
    }

    if (!testData?.schedule?.length) {
        return (
            <Container>
                <Alert severity="warning">
                    No test content available.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Study Your {testData.contentType}s
                </Typography>
                
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    Review when each {testData.contentType} was taken. You'll be tested on these dates later!
                </Typography>

                <Grid container spacing={3}>
                    {testData.schedule.map((scheduleItem, index) => {
                        const mediaUrl = imageUrls[scheduleItem.imageId];
                        const creationDate = new Date(scheduleItem.creationDateTime);
                        const formattedDate = format(creationDate, "MMMM d, yyyy");
                        const formattedTime = format(creationDate, "h:mm a");

                        return (
                            <Grid item xs={12} sm={6} md={4} key={scheduleItem.id || index}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {mediaUrl ? (
                                        <>
                                            {testData.contentType === 'picture' ? (
                                                <CardMedia
                                                    component="img"
                                                    src={mediaUrl.url}
                                                    alt={`${testData.contentType} ${index + 1}`}
                                                    sx={{ 
                                                        height: 250,
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            ) : (
                                                <CardMedia
                                                    component="video"
                                                    src={mediaUrl.url}
                                                    controls
                                                    sx={{ 
                                                        height: 250
                                                    }}
                                                />
                                            )}
                                            <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {testData.contentType} {index + 1}
                                                </Typography>
                                                <Box sx={{ mt: 'auto' }}>
                                                    <Chip 
                                                        label={formattedDate}
                                                        color="primary"
                                                        sx={{ mb: 1, mr: 1 }}
                                                    />
                                                </Box>
                                            </Box>
                                        </>
                                    ) : (
                                        <Box sx={{ 
                                            height: 250, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center' 
                                        }}>
                                            <CircularProgress />
                                        </Box>
                                    )}
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/')}
                        size="large"
                    >
                        Back to Dashboard
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/upcoming-tests')}
                        size="large"
                    >
                        View Upcoming Tests
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default StudyTest;
