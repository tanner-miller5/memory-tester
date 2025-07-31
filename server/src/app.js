const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const schedule = require('node-schedule');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Schema Definitions
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  testHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }]
});

const testSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contentType: { type: String, enum: ['picture', 'video'] },
  content: [{ 
    originalContent: String,
    options: [String],
    correctAnswer: String
  }],
  schedule: [{
    date: Date,
    completed: { type: Boolean, default: false },
    score: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Test = mongoose.model('Test', testSchema);

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({ username, password, email });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/test/create', async (req, res) => {
  try {
    const { userId, contentType, content } = req.body;
    const test = new Test({
      userId,
      contentType,
      content,
      schedule: [
        { date: new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 1 day
        { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 1 week
        { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 2 weeks
        // Add other intervals
      ]
    });
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Schedule notification jobs
schedule.scheduleJob('0 0 * * *', async () => {
  const today = new Date();
  const tests = await Test.find({
    'schedule.date': {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });
  // Implementation for notifications
});

module.exports = app;