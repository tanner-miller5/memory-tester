const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/memory_tester', {
  dialect: 'postgres',
  logging: false
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
    allowNull: false
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
    const user = await User.create({ username, password, email });
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

// Database sync
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

module.exports = app;