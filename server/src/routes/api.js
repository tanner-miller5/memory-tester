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
const ExifReader = require('exif-reader'); // Add this package for image metadata
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffprobeStatic = require('ffprobe-static');
const tmp = require('tmp');
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

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
router.post('/test/create', auth,
    upload.array('content', 10), async (req, res) => {
  try {
    const files = req.files;
    const { contentType } = req.body;
    const contentWithMetadata = [];

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 files allowed' });
    }

    const userId = req.user.id;

    // First, delete all previous tests for this user
    await Test.destroy({
      where: {
        UserId: userId
      }
    });

    // Also delete associated images if needed
    await Image.destroy({
      where: {
        UserId: userId
      }
    });


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
    let images = await Promise.all(req.files.map(async (file) => {
      let creationDateTime;
      console.log(contentType);

      if (contentType === 'picture') {
        // Extract EXIF data for images
        const buffer = file.buffer;
        try {
          const metadata = await sharp(buffer).metadata();
          //console.log(metadata);
          console.log(ExifReader)
          const exifData = ExifReader(metadata.exif);
          console.log(exifData);
          creationDateTime = exifData.exif.DateTimeOriginal ||
              file.lastModified;
          //console.log(creationDateTime);
        } catch (error) {
          creationDateTime = new Date(file.lastModified);
        }
      } else if (contentType === 'video') {
        try {
          // Create a temporary file
          const tmpobj = tmp.fileSync();

          // Write the buffer to the temporary file
          await writeFile(tmpobj.name, file.buffer);

          // Get video metadata using ffprobe
          const metadata = await new Promise((resolve, reject) => {
            ffmpeg.setFfprobePath(ffprobeStatic.path);
            ffmpeg.ffprobe(tmpobj.name, (err, metadata) => {
              // Clean up the temporary file
              tmpobj.removeCallback();

              if (err) reject(err);
              else resolve(metadata);
            });
          });

          // Extract creation time from metadata
          creationDateTime = metadata?.format?.tags?.['com.apple.quicktime.creationdate'] ||
              metadata?.format?.tags?.creation_time ||
              file.lastModified ||
              new Date();

          console.log('Video metadata:', {
            format: metadata?.format,
            duration: metadata?.format?.duration,
            creationTime: creationDateTime
          });

        } catch (error) {
          console.error('Error extracting video metadata:', error);
          creationDateTime = file.lastModified || new Date();
        }

      }

      return await Image.create({
        filename: file.originalname,
        data: file.buffer,
        contentType: file.mimetype,
        UserId: req.user.userId,
        metadata: {
          size: file.size,
          originalName: file.originalname,
          creationDateTime: new Date(creationDateTime)
        }
      });
    }));

    images = await Image.findAll({
      where: {
        UserId: userId
      }
    });

    let randImageId = [
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length),
      Math.floor(Math.random() * images.length)
    ]

    // Calculate test schedule based on current time
    const now = new Date();
    const schedule = [
      { id: 0, date: new Date(now.getTime() + 60 * 1000), completed: false, imageId: images[randImageId[0]].id, creationDateTime: images[randImageId[0]]?.metadata?.creationDateTime },    // 1 minute
      { id: 1, date: new Date(now.getTime() + 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[1]].id, creationDateTime: images[randImageId[1]]?.metadata?.creationDateTime },    // 24 hours
      { id: 2, date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[2]].id, creationDateTime: images[randImageId[2]]?.metadata?.creationDateTime }, // 1 week
      { id: 3, date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[3]].id, creationDateTime: images[randImageId[3]]?.metadata?.creationDateTime }, // 2 weeks
      { id: 4, date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[4]].id, creationDateTime: images[randImageId[4]]?.metadata?.creationDateTime }, // 1 month
      { id: 5, date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[5]].id, creationDateTime: images[randImageId[5]]?.metadata?.creationDateTime }, // 2 months
      { id: 6, date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[6]].id, creationDateTime: images[randImageId[6]]?.metadata?.creationDateTime }, // 3 months
      { id: 7, date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[7]].id, creationDateTime: images[randImageId[7]]?.metadata?.creationDateTime }, // 6 months
      { id: 8, date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), completed: false, imageId: images[randImageId[8]].id, creationDateTime: images[randImageId[8]]?.metadata?.creationDateTime }  // 1 year
    ];

    // Create the test
    const test = await Test.create({
      UserId: req.user.userId,
      contentType,
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

router.delete('/test/:id', auth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get all image IDs associated with this test
    images = await Image.findAll({
      where: {
        UserId: test.UserId
      }
    });
    const imageIds = images.map(item => item.id);

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


router.get('/tests/all', auth, async (req, res) => {
  try {
    const tests = await Test.findAll({
        where: {
            UserId: req.user.id
        },
        order: [['createdAt', 'DESC']]
    });
    res.json(tests);
  } catch (error) {
    console.error('Error fetching all tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});


// Submit answer
router.post('/test/:id/schedule/:scheduleId/answer', auth, async (req, res) => {
  try {
    const { selectedAnswer, correct } = req.body;
    const test = await Test.findByPk(req.params.id);

    if (!test || test.UserId !== req.user.userId) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const currentSchedule = test.schedule[req.params.scheduleId];
    if (!currentSchedule) {
      return res.status(400).json({ error: 'Test already completed' });
    }

    //const correct = currentSchedule.creationDateTime === selectedAnswer;

    // Update the schedule with the answer
    const scheduleIndex = test.schedule.indexOf(currentSchedule);
    const updatedSchedule = [...test.schedule];  // Create a new array
    updatedSchedule[scheduleIndex] = {
      ...currentSchedule,
      completed: true,
      answer: {
        correct,
        answeredAt: new Date(),
        selectedAnswer
      }
    };

    // Update the test in the database using Sequelize
    await test.update({
      schedule: updatedSchedule
    }, {
      where: { id: test.id }
    });

    // Reload the test to ensure we have the latest data
    await test.reload();

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
      correctImageId: test.schedule[req.params.scheduleId].imageId
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
