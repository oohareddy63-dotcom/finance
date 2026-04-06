# 🚀 MongoDB Quick Start Guide

## 📋 Prerequisites
- Node.js (v14+)
- MongoDB (Local or MongoDB Atlas)

## ⚡ Quick Setup

### Option 1: Use Setup Script (Windows PowerShell)
```powershell
# Run the setup script
.\setup-mongodb.ps1

# Start the server
npm start
```

### Option 2: Manual Setup

#### 1. Install Dependencies
```bash
# Use MongoDB package configuration
cp package-mongo.json package.json
npm install
```

#### 2. Configure Environment
```bash
# Copy environment file
cp .env-mongo.example .env

# Edit .env with your MongoDB connection
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/finance_db

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_db
```

#### 3. Seed Database
```bash
npm run seed
```

#### 4. Start Server
```bash
npm start
# or for development
npm run dev
```

## 🧪 Test the API

### 1. Register Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@finance.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.com",
    "password": "admin123"
  }'
```

### 3. Create Financial Record
```bash
# Use the token from login response
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 5000.00,
    "type": "income",
    "category": "Salary",
    "date": "2024-01-15",
    "description": "Monthly salary"
  }'
```

### 4. Get Dashboard Summary
```bash
curl -X GET http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Sample Data

The seeder creates:
- **5 users** with different roles
- **30+ financial records** per user
- **6 months** of transaction history
- **Realistic categories** and amounts

### Default Users
- **Admin**: `admin@finance.com` / `admin123`
- **Analyst**: `analyst@finance.com` / `analyst123`
- **Viewer**: `viewer@finance.com` / `viewer123`

## 📊 Enhanced Features with MongoDB

### Advanced Analytics
```bash
# Get detailed analytics
curl -X GET http://localhost:3000/api/dashboard/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get top categories
curl -X GET http://localhost:3000/api/dashboard/top-categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get spending trends
curl -X GET http://localhost:3000/api/dashboard/spending-trends \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Aggregation Examples
```javascript
// MongoDB aggregation for monthly trends
db.financialrecords.aggregate([
  {
    $group: {
      _id: { $month: "$date", $year: "$date", $type: "$type" },
      totalAmount: { $sum: "$amount" },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id.year": -1, "_id.month": -1 } }
])
```

## 🔍 MongoDB Compass

1. **Connect** to your database
2. **Explore** collections and indexes
3. **Monitor** query performance
4. **Visualize** aggregation pipelines

Connection string: `mongodb://localhost:27017/finance_db`

## 🚨 Troubleshooting

### Connection Issues
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/finance_db"

# Check if MongoDB is running
Get-Service -Name "MongoDB"
```

### Database Issues
```bash
# Clear and re-seed database
npm run seed

# Check database contents
mongosh "mongodb://localhost:27017/finance_db" --eval "db.users.find().pretty()"
```

## 🎉 Success!

Your MongoDB-powered Finance Backend is now running with:
- ✅ Advanced analytics and aggregation
- ✅ Better performance and scalability
- ✅ Production-ready architecture
- ✅ Enhanced data modeling

Visit `http://localhost:3000` to explore the API!
