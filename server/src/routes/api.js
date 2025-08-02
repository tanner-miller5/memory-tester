const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const TestScheduler = require('../services/testScheduler');
const { sequelize, User, Test } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Sequelize } = require('sequelize');
const adminAuth = require("../middleware/adminAuth");


// Auth routes
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Send response
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test routes
router.post('/test/create', auth, adminAuth,
    upload.array('content'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const contentType = req.body.contentType;
    if (!contentType) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    // Convert file paths to URLs
    const content = req.files.map(file => ({
      originalContent: `/uploads/${path.basename(file.path)}`,
      options: [],
      correctAnswer: `/uploads/${path.basename(file.path)}`
    }));

    const test = await Test.create({
      UserId: req.user.userId,
      contentType: contentType,
      content: content,
      schedule: [
        { date: new Date(Date.now() + 60 * 1000), completed: false },
        { date: new Date(Date.now() + 24 * 60 * 60 * 1000), completed: false },
        { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false },
        { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), completed: false }
      ]
    });

    res.status(201).json(test);
  } catch (error) {
    console.error('Test creation error:', error);
    res.status(400).json({ error: error.message });
  }
});


router.get('/test/:id', auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard route
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'points',
        [sequelize.literal('(SELECT COUNT(*) FROM "Tests" WHERE "Tests"."UserId" = "User"."id")'), 'testsCompleted']
      ],
      order: [['points', 'DESC']],
      limit: 100
    });

    const leaderboardData = users.map(user => ({
      id: user.id,
      username: user.username,
      totalScore: user.points,
      testsCompleted: parseInt(user.getDataValue('testsCompleted'), 10) || 0,
      averageTime: 0 // You can add this calculation if you store completion times in your Tests table
    }));

    res.json(leaderboardData);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tests/upcoming', auth, async (req, res) => {
  try {
    const tests = await Test.findAll({
      where: {
        UserId: req.user.id
      }
    });
    res.json(tests);
  } catch (error) {
    console.error('Error fetching upcoming tests:', error);
    res.status(500).json({ message: 'Error fetching upcoming tests' });
  }
});

router.get('/users/:id/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Test,
        required: false,
        limit: 5,
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      username: user.username,
      email: user.email,
      points: user.points,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      testsCompleted: user.Tests ? user.Tests.length : 0,
      recentTests: user.Tests ? user.Tests.map(test => ({
        id: test.id,
        date: test.createdAt,
        contentType: test.contentType
      })) : []
    };

    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      email
    });
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
