const mongoose = require('mongoose');

const database = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/memory-tester', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = database;
