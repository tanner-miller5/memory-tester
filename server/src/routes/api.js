const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const TestScheduler = require('../services/testScheduler');

// Auth routes
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test routes
router.post('/test/create', auth, upload.array('content'), async (req, res) => {
  try {
    const files = req.files.map(file => ({
      path: file.path,
      originalname: file.originalname
    }));
    
    const test = new Test({
      userId: req.user.userId,
      contentType: req.body.contentType,
      content: files.map(file => ({
        originalContent: file.path,
        options: [], // Will be populated with random options
        correctAnswer: file.path
      })),
      schedule: TestScheduler.createSchedule()
    });
    
    await test.save();
    res.status(201).json(test);
  } catch (error) {
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
    const users = await User.find()
      .sort({ points: -1 })
      .limit(100)
      .select('username points testsCompleted');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
