const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');

require('dotenv').config();
const bcrypt = require('bcrypt');
const apiRouter = require('./routes/api'); // adjust path as needed
const { sequelize } = require('./models')


const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api', apiRouter);

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