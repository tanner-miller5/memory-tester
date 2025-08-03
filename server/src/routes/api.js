const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const TestScheduler = require('../services/testScheduler');
const { sequelize, User, Test, Image } = require('../models');
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
    upload.array('content', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 files allowed' });
    }


    const contentType = req.body.contentType;
    if (!['picture', 'video'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type. Must be either "picture" or "video"' });
    }


    // Validate file types
    const invalidFile = req.files.find(file => {
      if (contentType === 'picture' && !file.mimetype.startsWith('image/')) {
        return true;
      }
      if (contentType === 'video' && !file.mimetype.startsWith('video/')) {
        return true;
      }
      return false;
    });

    if (invalidFile) {
      return res.status(400).json({
        error: `Invalid file type for ${invalidFile.originalname}. Must be ${contentType} file.`
      });
    }
    // Save images to database
    const images = await Promise.all(req.files.map(async (file) => {
      return await Image.create({
        filename: file.originalname,
        data: file.buffer,
        contentType: file.mimetype,
        UserId: req.user.userId,
        metadata: {
          size: file.size,
          originalName: file.originalname
        }
      });
    }));

    // Calculate test schedule based on current time
    const now = new Date();
    const schedule = [
      { date: new Date(now.getTime() + 24 * 60 * 60 * 1000), completed: false },    // 24 hours
      { date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), completed: false }, // 1 week
      { date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), completed: false }, // 2 weeks
      { date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), completed: false }, // 1 month
      { date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), completed: false }, // 2 months
      { date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), completed: false }, // 3 months
      { date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), completed: false }, // 6 months
      { date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), completed: false }  // 1 year
    ];

    // Create test content with image references
    const content = images.map(image => ({
      imageId: image.id,
      originalContent: `/api/images/${image.id}`,
      options: [], // Will be populated during test taking
      correctAnswer: `/api/images/${image.id}`
    }));

    // Create the test
    const test = await Test.create({
      UserId: req.user.userId,
      contentType,
      content,
      schedule,
      status: 'active',
      difficulty: req.body.difficulty || 'normal',
      createdAt: now,
      metadata: {
        itemCount: images.length,
        totalScheduledTests: schedule.length,
        completedTests: 0
      }
    });

    res.status(201).json({
      id: test.id,
      contentType: test.contentType,
      itemCount: images.length,
      schedule: test.schedule,
      difficulty: test.difficulty,
      status: test.status
    });

  } catch (error) {
    console.error('Test creation error:', error);
    res.status(500).json({
      error: 'Failed to create test. Please try again.'
    });
  }
});

// Add a new endpoint to serve images
router.get('/images/:id', auth, async (req, res) => {
  try {
    const image = await Image.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.set('Content-Type', image.contentType);
    res.send(image.data);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});



router.get('/test/:id', auth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
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

// Update delete endpoint to clean up images
router.delete('/test/:id', auth, adminAuth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Delete associated images from database and filesystem
    const imageIds = test.content.map(item => item.imageId);
    const images = await Image.findAll({
      where: {
        id: imageIds
      }
    });

    // Delete files from filesystem
    await Promise.all(images.map(image =>
        fs.unlink(path.join(__dirname, '../../public', image.path))
            .catch(err => console.error(`Error deleting file for image ${image.id}:`, err))
    ));

    // Delete image records from database
    await Image.destroy({
      where: {
        id: imageIds
      }
    });

    // Delete the test
    await test.destroy();

    res.json({ message: 'Test and associated images deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
});


// Get all tests (admin only)
router.get('/tests/all', auth, adminAuth, async (req, res) => {
  try {
    const tests = await Test.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(tests);
  } catch (error) {
    console.error('Error fetching all tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Get question with options
router.get('/test/:id/question', auth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test || test.UserId !== req.user.userId) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get the current schedule that's not completed
    const currentSchedule = test.schedule.find(s => !s.completed);
    if (!currentSchedule) {
      return res.status(400).json({ error: 'Test already completed' });
    }

    // Get the correct image
    const correctImage = test.content[0];

    // Get 3 random images for distractors
    const distractors = await Image.findAll({
      where: {
        id: { [Sequelize.Op.ne]: correctImage.imageId },
        contentType: { [Sequelize.Op.startsWith]: test.contentType === 'picture' ? 'image/' : 'video/' }
      },
      order: Sequelize.literal('RANDOM()'),
      limit: 3
    });

    // Combine correct answer with distractors and shuffle
    const options = [
      { imageId: correctImage.imageId },
      ...distractors.map(d => ({ imageId: d.id }))
    ].sort(() => Math.random() - 0.5);

    res.json({
      options,
      scheduleDate: currentSchedule.date,
      scheduleIndex: test.schedule.indexOf(currentSchedule),
      totalSchedules: test.schedule.length
    });

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// Submit answer
router.post('/test/:id/answer', auth, async (req, res) => {
  try {
    const { selectedAnswer } = req.body;
    const test = await Test.findByPk(req.params.id);

    if (!test || test.UserId !== req.user.userId) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const currentSchedule = test.schedule.find(s => !s.completed);
    if (!currentSchedule) {
      return res.status(400).json({ error: 'Test already completed' });
    }

    const correct = test.content[0].imageId === selectedAnswer;

    // Update the schedule with the answer
    const scheduleIndex = test.schedule.indexOf(currentSchedule);
    test.schedule[scheduleIndex] = {
      ...currentSchedule,
      completed: true,
      answer: {
        correct,
        answeredAt: new Date(),
        selectedAnswer
      }
    };

    // Award points if correct
    if (correct) {
      await User.increment('points', {
        by: 100,
        where: { id: req.user.userId }
      });
    }

    await test.save();

    res.json({
      correct,
      message: correct ? 'Correct answer!' : 'Incorrect answer',
      correctImageId: test.content[0].imageId,
      nextSchedule: test.schedule.find(s => !s.completed)?.date || null
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get test results
router.get('/test/:id/results', auth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);

    if (!test || test.UserId !== req.user.userId) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const completedSchedules = test.schedule.filter(s => s.completed);
    const remainingSchedules = test.schedule.filter(s => !s.completed);

    const results = {
      testId: test.id,
      contentType: test.contentType,
      progress: {
        completedSchedules: completedSchedules.length,
        remainingSchedules: remainingSchedules.length,
        totalSchedules: test.schedule.length
      },
      performance: {
        correctAnswers: completedSchedules.filter(s => s.answer?.correct).length,
        accuracy: (completedSchedules.filter(s => s.answer?.correct).length / completedSchedules.length) * 100 || 0
      },
      schedules: completedSchedules.map(schedule => ({
        date: schedule.date,
        completed: true,
        correct: schedule.answer.correct,
        answeredAt: schedule.answer.answeredAt
      })),
      nextTest: remainingSchedules[0]?.date || null
    };

    res.json(results);

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});



module.exports = router;
