import React, {useCallback, useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    Grid,
    Button,
    CircularProgress,
    Card,
    CardMedia,
    CardActionArea,
    Alert
} from '@mui/material';
import { format } from 'date-fns';

function TakeTest() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState(null);

    // Fetch test data and question
    const { data: questionData, isLoading, error, refetch } = useQuery(
        ['test-question', testId],
        async () => {
            const response = await axios.get(
                `http://localhost:3001/api/test/${testId}/question`,
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }
            );
            return response.data;
        }
    );

    // Submit answer mutation
    const submitAnswer = useMutation(
        async (selectedImageId) => {
            const response = await axios.post(
                `http://localhost:3001/api/test/${testId}/answer`,
                { selectedAnswer: selectedImageId },
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }
            );
            return response.data;
        },
        {
            onSuccess: (data) => {
                setFeedback({
                    correct: data.correct,
                    message: data.correct ? 'Correct!' : 'Incorrect. Try to remember better next time.',
                    nextSchedule: data.nextSchedule
                });
            }
        }
    );

    const handleAnswerSelect = async (selectedImageId) => {
        if (submitAnswer.isLoading) return;
        setSelectedAnswer(selectedImageId);
        await submitAnswer.mutateAsync(selectedImageId);
    };

    const handleViewResults = () => {
        navigate(`/test/${testId}/results`);
    };

    const handleNextTest = () => {
        setSelectedAnswer(null);
        setFeedback(null);
        refetch();
    };

    // Add this function to load images with authentication
    const loadAuthenticatedImage = async (imageId) => {
        try {
            const response = await axios.get(
                `http://localhost:3001/api/images/${imageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    responseType: 'blob'
                }
            );
            return URL.createObjectURL(response.data);
        } catch (error) {
            console.error('Error loading image:', error);
            return null;
        }
    };

    // Add state for image URLs
    const [imageUrls, setImageUrls] = useState({});

    // Load images when options change
    useEffect(() => {
        if (questionData?.options) {
            const loadImages = async () => {
                const urls = {};
                for (const option of questionData.options) {
                    urls[option.imageId] = await loadAuthenticatedImage(option.imageId);
                }
                setImageUrls(urls);
            };
            loadImages();
        }

        // Cleanup function to revoke object URLs
        return () => {
            Object.values(imageUrls).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [questionData?.options]);



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

    if (!questionData) {
        return (
            <Container>
                <Alert severity="info">
                    No more questions scheduled for now. Check the results page for your progress.
                </Alert>
                <Button
                    variant="contained"
                    onClick={handleViewResults}
                    sx={{ mt: 2 }}
                >
                    View Results
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Memory Test
                </Typography>

                <Typography variant="subtitle1" gutterBottom>
                    Schedule {questionData.scheduleIndex + 1} of {questionData.totalSchedules}
                    {questionData.scheduleDate && (
                        <span> - {format(new Date(questionData.scheduleDate), 'PPP')}</span>
                    )}
                </Typography>

                {feedback && (
                    <Alert
                        severity={feedback.correct ? "success" : "error"}
                        sx={{ mb: 2 }}
                    >
                        {feedback.message}
                    </Alert>
                )}

                <Typography variant="h6" gutterBottom>
                    Select the image you saw during the learning phase:
                </Typography>

                <Grid container spacing={2} sx={{ my: 2 }}>
                    {questionData.options.map((option, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                            <Card
                                sx={{
                                    border: selectedAnswer === option.imageId ? '2px solid #1976d2' : 'none',
                                    opacity: feedback && selectedAnswer !== option.imageId ? 0.7 : 1
                                }}
                            >
                                <CardActionArea
                                    onClick={() => !feedback && handleAnswerSelect(option.imageId)}
                                    disabled={!!feedback}
                                >
                                    <CardMedia
                                        component="img"
                                        src={imageUrls[option.imageId]}
                                        alt={`Option ${index + 1}`}
                                        sx={{
                                            height: 300,
                                            objectFit: 'cover'
                                        }}
                                    />
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {feedback && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                        {feedback.nextSchedule ? (
                            <Button
                                variant="contained"
                                onClick={handleNextTest}
                                size="large"
                            >
                                Next Test
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleViewResults}
                                size="large"
                                color="success"
                            >
                                View Final Results
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default TakeTest;