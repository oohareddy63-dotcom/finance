const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true });
    
    // Financial records indexes
    await mongoose.connection.collection('financialrecords').createIndex({ user_id: 1 });
    await mongoose.connection.collection('financialrecords').createIndex({ date: -1 });
    await mongoose.connection.collection('financialrecords').createIndex({ user_id: 1, date: -1 });
    await mongoose.connection.collection('financialrecords').createIndex({ type: 1 });
    await mongoose.connection.collection('financialrecords').createIndex({ category: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.log('Indexes may already exist:', error.message);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
