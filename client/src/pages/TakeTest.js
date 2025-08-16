import React, {useCallback, useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    Grid,
    Button,
    CircularProgress,
    Card,
    CardMedia,
    CardActionArea,
    Alert
} from '@mui/material';
import { format } from 'date-fns';
import generateFakeDates from '../utils/dateUtils';

function TakeTest() {
    const { testId, scheduleId } = useParams();
    const navigate = useNavigate();
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [dateOptions, setDateOptions] = useState([]);
    const [imageUrls, setImageUrls] = useState({});

    // Fetch test and current schedule data
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

    // Submit answer mutation
    const submitAnswer = useMutation(
        async (answerData) => {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/test/${testId}/schedule/${scheduleId}/answer`,
                answerData,
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
                    message: data.correct ? 'Correct!' : 'Incorrect. Try to remember better next time.'
                });
            }
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

    // Load media when testData is available
    useEffect(() => {
        if (testData?.schedule?.[scheduleId]?.imageId) {
            const loadMedia = async () => {
                const imageId = testData?.schedule?.[scheduleId]?.imageId;
                const result = await loadAuthenticatedImage(imageId);
                if (result) {
                    setImageUrls(prev => ({
                        ...prev,
                        [imageId]: result
                    }));
                }
            };
            loadMedia();
        }

        return () => {
            Object.values(imageUrls).forEach(media => {
                if (media?.url) URL.revokeObjectURL(media.url);
            });
        };
    }, [testData?.schedule]);

    // Generate date options when testData is available
    useEffect(() => {
        console.log('testData:', testData); // Debug log
        
        if (testData?.schedule?.[scheduleId]?.creationDateTime) {
            console.log('creationDateTime:', testData?.schedule?.[scheduleId]?.creationDateTime); // Debug log
            
            try {
                // Generate date options including the real date and 3 fake dates
                const realDate = new Date(testData?.schedule?.[scheduleId]?.creationDateTime);
                console.log('realDate:', realDate); // Debug log
                
                // Check if date is valid
                if (isNaN(realDate.getTime())) {
                    console.error('Invalid date:', testData?.schedule?.[scheduleId]?.creationDateTime);
                    return;
                }
                
                const fakeOptions = generateFakeDates(realDate);
                console.log('fakeOptions:', fakeOptions); // Debug log

                // Combine real and fake dates, shuffle them
                const allOptions = [...fakeOptions, realDate]
                    .map(date => {
                        // Create date without time (set to start of day)
                        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        return {
                            date: dateOnly,
                            formatted: format(dateOnly, "MMMM d, yyyy"), // Remove time from format
                            isCorrect: dateOnly.getTime() === new Date(realDate.getFullYear(), realDate.getMonth(), realDate.getDate()).getTime()
                        };
                    })
                    .sort(() => Math.random() - 0.5);

            console.log('allOptions:', allOptions); // Debug log
            setDateOptions(allOptions);
        } catch (error) {
            console.error('Error generating date options:', error);
        }
    } else {
        console.log('Missing creationDateTime:', {
            hasTestData: !!testData,
            hasCreationDateTime: !!testData?.schedule?.[scheduleId]?.creationDateTime,
        });
    }
}, [testData]);

const handleSubmit = (e) => {
    e.preventDefault();
    const selectedOption = dateOptions.find(opt => opt.formatted === selectedAnswer);
    const correct = selectedOption?.isCorrect;
    
    // Convert the selected date to ISO format (date only, no time)
    const selectedDateISO = selectedOption?.date?.toISOString().split('T')[0]; // This gives YYYY-MM-DD format
    
    submitAnswer.mutate({ 
        selectedAnswer: selectedDateISO,
        correct 
    });
};

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

    if (!testData?.schedule?.[scheduleId]?.creationDateTime) {
        return (
            <Container>
                <Alert severity="warning">
                    No test content available.
                </Alert>
            </Container>
        );
    }

    // Check if content type is video
    const isVideo = (contentType) => {
        return contentType && contentType.startsWith('video/');
    };

    const currentContent = testData?.schedule?.[scheduleId];
    const currentImageUrl = imageUrls[currentContent.imageId];

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    When was this {testData.contentType} taken?
                </Typography>

                {currentImageUrl ? (
                    <Card sx={{ mb: 4 }}>
                        {testData.contentType === 'picture' ? (
                            <CardMedia
                                component="img"
                                src={currentImageUrl.url}
                                alt="Test content"
                                sx={{ 
                                    maxHeight: '500px', 
                                    width: '100%',
                                    objectFit: 'contain' 
                                }}
                            />
                        ) : (
                            <CardMedia
                                component="video"
                                src={currentImageUrl.url}
                                controls
                                sx={{ 
                                    maxHeight: '500px',
                                    width: '100%'
                                }}
                            />
                        )}
                    </Card>
                ) : (
                    <Card sx={{ mb: 4, p: 4 }}>
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                            <CircularProgress />
                        </Box>
                    </Card>
                )}

                {feedback && (
                    <Alert severity={feedback.correct ? "success" : "error"} sx={{ mb: 3 }}>
                        {feedback.message}
                    </Alert>
                )}

                {!feedback && (
                    <>
                        {dateOptions.length > 0 ? (
                            <form onSubmit={handleSubmit}>
                                <Typography variant="h6" gutterBottom>
                                    Select the date when this {testData.contentType} was taken:
                                </Typography>
                                <RadioGroup
                                    value={selectedAnswer || ''}
                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                >
                                    {dateOptions.map((option, index) => (
                                        <FormControlLabel
                                            key={index}
                                            value={option.formatted}
                                            control={<Radio />}
                                            label={option.formatted}
                                        />
                                    ))}
                                </RadioGroup>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ mt: 3 }}
                                    disabled={!selectedAnswer || submitAnswer.isLoading}
                                >
                                    {submitAnswer.isLoading ? 'Submitting...' : 'Submit Answer'}
                                </Button>
                            </form>
                        ) : (
                            <Alert severity="info">
                                Loading date options...
                                {testData?.schedule?.[scheduleId]?.creationDateTime && (
                                    <pre style={{ marginTop: '10px', fontSize: '12px' }}>
                                        Debug: {JSON.stringify(testData?.schedule?.[scheduleId]?.creationDateTime, null, 2)}
                                    </pre>
                                )}
                            </Alert>
                        )}
                    </>
                )}

                {feedback && (
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 3 }}
                        onClick={() => navigate('/')}
                    >
                        Return to Dashboard
                    </Button>
                )}
            </Box>
        </Container>
    );
}

export default TakeTest;