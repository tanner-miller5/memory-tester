import React, { useState, useEffect } from 'react';
import { Box, Card, Button, Typography, Grid } from '@mui/material';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';

const TestInterface = ({ testId }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);

  const { data: test } = useQuery(['test', testId], () =>
    axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/test/${testId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
  }).then(res => res.data)
  );

  const submitAnswer = useMutation((answer) => 
    axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/test/${testId}/answer`, {
      questionIndex: currentQuestion,
      answer
    })
  );

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    submitAnswer.mutate(answer, {
      onSuccess: (response) => {
        if (response.data.correct) {
          setScore(prev => prev + 1);
        }
        if (currentQuestion < test.content.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
        }
      }
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {test && (
        <>
          <Typography variant="h4" gutterBottom>
            Memory Test - Question {currentQuestion + 1}/{test.content.length}
          </Typography>
          <Card sx={{ p: 2, mb: 2 }}>
            <img
              src={test.content[currentQuestion].originalContent}
              alt="Test content"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Card>
          <Grid container spacing={2}>
            {test.content[currentQuestion].options.map((option, index) => (
              <Grid item xs={6} key={index}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null}
                >
                  <img
                    src={option}
                    alt={`Option ${index + 1}`}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Button>
              </Grid>
            ))}
          </Grid>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Current Score: {score}/{test.content.length}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default TestInterface;
