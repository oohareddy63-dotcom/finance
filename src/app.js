require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Import database connection
const { connectDB } = require('./config/database');

// Import middleware
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;


// 🔐 Security middleware
app.use(helmet());

// 🌐 CORS (simplified for development)
app.use(cors({
  origin: '*',
  credentials: true
}));

// 📦 Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📊 Logging
app.use(morgan('dev'));
app.use(requestLogger);


// ❤️ Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database: 'MongoDB'
  });
});


// 🚀 API Routes (CORRECT)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);


// 🏠 Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Finance Backend API Running 🚀',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      users: 'GET /api/users',
      records: 'POST /api/records',
      dashboard: 'GET /api/dashboard/summary'
    }
  });
});


// ❌ 404 handler
app.use(notFoundHandler);

// ❌ Global error handler
app.use(errorHandler);


// 🚀 Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`👉 http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};


// 🛑 Graceful shutdown (FIXED mongoose issue)
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});


// Start server
if (require.main === module) {
  startServer();
}

module.exports = app;