require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/database');
const NotificationService = require('./src/services/notifications');

const PORT = process.env.PORT || 3001;

// Connect to DB
connectDB();

// Initialize notification service
NotificationService.init();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
