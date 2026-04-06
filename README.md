# Finance Data Processing and Access Control Backend - MongoDB Version

A comprehensive backend system for managing financial records with role-based access control, built with Node.js, Express, and MongoDB.

## 🚀 MongoDB Migration

This version has been migrated from SQLite to MongoDB for better scalability, performance, and production readiness.

### Key MongoDB Features
- **Document-based storage** for flexible financial record structures
- **Aggregation pipelines** for complex analytics and reporting
- **Indexing** for optimal query performance
- **Schema validation** with Mongoose
- **Population** for relational data
- **GridFS support** ready for file attachments

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (v4.4 or higher) - Local installation or MongoDB Atlas
3. **npm** or **yarn**

## 🛠️ Installation

### 1. Install Dependencies

```bash
# Copy MongoDB package configuration
cp package-mongo.json package.json

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment configuration
cp .env-mongo.example .env

# Edit .env file with your MongoDB connection string
```

**Environment Variables:**
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/finance_db
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_db
```

### 3. Database Setup

#### Option A: Local MongoDB
```bash
# Start MongoDB service
# On Windows: Start MongoDB service from Services
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# Seed database with sample data
npm run seed
```

#### Option B: MongoDB Atlas
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`
5. Seed the database:
```bash
npm run seed
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🗄️ MongoDB Schema Design

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (viewer|analyst|admin),
  status: String (active|inactive),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Financial Record Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  amount: Number,
  type: String (income|expense),
  category: String,
  date: Date,
  description: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes for Performance
```javascript
// User indexes
{ email: 1 } (unique)
{ username: 1 } (unique)

// Financial record indexes
{ user_id: 1, date: -1 }
{ type: 1 }
{ category: 1 }
{ date: -1 }
```

## 📊 Enhanced Analytics with MongoDB Aggregation

### Dashboard Summary
```javascript
// MongoDB Aggregation Pipeline for dashboard summary
[
  { $match: { user_id: userId, ...filters } },
  {
    $group: {
      _id: null,
      totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
      totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      totalRecords: { $sum: 1 },
      averageAmount: { $avg: '$amount' }
    }
  }
]
```

### Category Analysis
```javascript
// Category-wise breakdown
[
  { $match: { user_id: userId } },
  {
    $group: {
      _id: { type: '$type', category: '$category' },
      totalAmount: { $sum: '$amount' },
      count: { $sum: 1 },
      averageAmount: { $avg: '$amount' }
    }
  }
]
```

## 🔧 MongoDB-Specific Features

### 1. Advanced Analytics
- **Aggregation Framework** for complex financial calculations
- **Multi-stage pipelines** for trend analysis
- **Group operations** for category summaries
- **Date operators** for time-based analysis

### 2. Performance Optimization
- **Compound indexes** for common query patterns
- **Query optimization** with proper indexing
- **Connection pooling** with Mongoose
- **Caching** with Mongoose lean queries

### 3. Data Integrity
- **Schema validation** with Mongoose
- **Referential integrity** with population
- **Transaction support** for data consistency
- **Unique constraints** for email/username

### 4. Scalability Features
- **Horizontal scaling** ready
- **Sharding support** for large datasets
- **Replica set** compatibility
- **GridFS** for file storage (receipts, documents)

## 🆚 MongoDB vs SQLite Comparison

| Feature | SQLite | MongoDB |
|---------|---------|---------|
| **Scalability** | Limited | Excellent |
| **Performance** | Good for small datasets | Excellent for large datasets |
| **Analytics** | Basic SQL queries | Advanced aggregation pipelines |
| **Schema** | Fixed tables | Flexible documents |
| **Relationships** | Foreign keys | Population & references |
| **Indexing** | Basic indexes | Compound & text indexes |
| **Production Ready** | Limited | Enterprise ready |

## 📡 API Endpoints

All endpoints remain the same as the SQLite version for seamless migration:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Financial Records
- `GET /api/records` - List records with advanced filtering
- `POST /api/records` - Create new record
- `GET /api/records/summary` - Category-wise analytics
- `GET /api/records/trends` - Monthly/weekly trends
- `GET /api/records/stats` - Statistical analysis

### Dashboard (Enhanced)
- `GET /api/dashboard/summary` - Dashboard overview
- `GET /api/dashboard/analytics` - Detailed analytics
- `GET /api/dashboard/top-categories` - Top spending categories
- `GET /api/dashboard/spending-trends` - Advanced trend analysis

## 🧪 Testing with MongoDB

### Sample Data
The seeder creates realistic financial data:
- **5 users** with different roles
- **6 months** of transaction history
- **Multiple categories** for income and expenses
- **Realistic amounts** and descriptions

### Test Queries
```javascript
// Find all records for a user in a date range
db.financialrecords.find({
  user_id: ObjectId("..."),
  date: {
    $gte: ISODate("2024-01-01"),
    $lte: ISODate("2024-12-31")
  }
}).sort({ date: -1 })

// Calculate monthly totals
db.financialrecords.aggregate([
  {
    $group: {
      _id: { $month: "$date", $year: "$date" },
      totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
      totalExpenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
    }
  }
])
```

## 🚀 Deployment

### MongoDB Atlas (Recommended for Production)
1. Create a free tier cluster
2. Configure network access (IP whitelist)
3. Create database user
4. Update environment variables
5. Deploy your application

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Configurations
```javascript
// production.js
module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  }
};
```

## 📈 Performance Tips

### 1. Index Optimization
```javascript
// Compound index for common queries
db.financialrecords.createIndex({ user_id: 1, date: -1, type: 1 })
```

### 2. Query Optimization
```javascript
// Use lean() for read-only operations
FinancialRecord.find(filters).lean().exec()

// Use select() to limit returned fields
FinancialRecord.find(filters).select('amount type date')
```

### 3. Aggregation Optimization
```javascript
// Add $match early in pipeline
// Use $project to reduce document size
// Limit results with $limit
```

## 🔍 Monitoring & Debugging

### MongoDB Compass
1. Connect to your database
2. Visualize data and indexes
3. Monitor query performance
4. Analyze aggregation pipelines

### Logging
```javascript
// Enable MongoDB query logging
mongoose.set('debug', true);

// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 });
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Errors**
   ```bash
   # Check MongoDB connection
   mongosh "mongodb://localhost:27017/finance_db"
   ```

2. **Authentication Issues**
   ```bash
   # Verify credentials
   mongosh "mongodb://username:password@host/finance_db"
   ```

3. **Performance Issues**
   ```javascript
   // Check query execution stats
   db.financialrecords.find({}).explain("executionStats")
   ```

## 📚 Additional Resources

- [MongoDB Node.js Driver](https://docs.mongodb.com/drivers/node)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Aggregation Framework](https://docs.mongodb.com/manual/aggregation/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## 🎯 Benefits of MongoDB Migration

✅ **Better Performance** for large datasets  
✅ **Advanced Analytics** with aggregation pipelines  
✅ **Scalability** for production workloads  
✅ **Flexible Schema** for future enhancements  
✅ **Enterprise Features** (replication, sharding)  
✅ **Cloud Integration** with MongoDB Atlas  
✅ **Rich Ecosystem** with tools and services  

The MongoDB version maintains all existing functionality while providing a robust foundation for scaling and advanced analytics!
