const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/memory_tester', {
  dialect: 'postgres',
  logging: false,
  schema: 'public',
  define: {
    schema: 'public'
  }

});

// Models
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const Test = sequelize.define('Test', {
  contentType: {
    type: DataTypes.ENUM('picture', 'video'),
    allowNull: false,
    field: 'contentType'
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  schedule: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Relationships
User.hasMany(Test);
Test.belongsTo(User);

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      email
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/test/create', async (req, res) => {
  try {
    const { userId, contentType, content } = req.body;
    const test = await Test.create({
      UserId: userId,
      contentType,
      content,
      schedule: [
        { date: new Date(Date.now() + 24 * 60 * 60 * 1000), completed: false }, // 1 day
        { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), completed: false }, // 1 week
        { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), completed: false }, // 2 weeks
        // Add other intervals
      ]
    });
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Schedule notification jobs
schedule.scheduleJob('0 0 * * *', async () => {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  const tests = await Test.findAll({
    where: sequelize.literal(`schedule @> '[{"date": "${today.toISOString()}", "completed": false}]'::jsonb`)
  });
  // Implementation for notifications
});

// Add this route to your app.js
app.post('/api/auth/login', async (req, res) => {
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
        points: user.points
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id/profile', async (req, res) => {
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


// Database sync
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

module.exports = app;