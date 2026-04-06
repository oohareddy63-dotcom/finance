# API Examples and Testing Guide - MongoDB Version

This document provides practical examples of how to use the Finance Backend API endpoints with MongoDB.

## Setup

1. Start the server:
   ```bash
   npm start
   ```

2. The API will be available at `http://localhost:3000`

3. Use a tool like Postman, Insomnia, or curl to test the endpoints

## Authentication Examples

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "analyst"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "role": "analyst",
    "status": "active",
    "permissions": ["read:dashboard", "read:records", "read:analytics"],
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "role": "analyst",
    "permissions": ["read:dashboard", "read:records", "read:analytics"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Profile

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Financial Records Examples

### Create Income Record

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 5000.00,
    "type": "income",
    "category": "Salary",
    "date": "2024-01-15",
    "description": "Monthly salary payment"
  }'
```

### Create Expense Record

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1200.50,
    "type": "expense",
    "category": "Rent",
    "date": "2024-01-01",
    "description": "Monthly rent payment"
  }'
```

### Get All Records

```bash
curl -X GET http://localhost:3000/api/records \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Records with Filters

```bash
curl -X GET "http://localhost:3000/api/records?type=expense&category=Rent&date_from=2024-01-01&date_to=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Records with Pagination

```bash
curl -X GET "http://localhost:3000/api/records?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a Record

```bash
curl -X PUT http://localhost:3000/api/records/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1300.00,
    "description": "Updated rent payment"
  }'
```

### Delete a Record

```bash
curl -X DELETE http://localhost:3000/api/records/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Dashboard Examples

### Get Dashboard Summary

```bash
curl -X GET http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Dashboard summary retrieved successfully",
  "summary": {
    "totalIncome": 5000.00,
    "totalExpenses": 2200.50,
    "netBalance": 2799.50,
    "totalRecords": 5,
    "averageAmount": 1000.10,
    "recentActivity": [
      {
        "id": "507f1f77bcf86cd799439011",
        "amount": 500.00,
        "type": "expense",
        "category": "Groceries",
        "date": "2024-01-14",
        "description": "Weekly groceries"
      }
    ]
  }
}
```

### Get Detailed Analytics

```bash
curl -X GET http://localhost:3000/api/dashboard/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Analytics retrieved successfully",
  "analytics": {
    "overview": {
      "totalIncome": 5000.00,
      "totalExpenses": 2200.50,
      "netBalance": 2799.50,
      "totalRecords": 5,
      "averageAmount": 1000.10
    },
    "by_category": [
      {
        "type": "income",
        "category": "Salary",
        "totalAmount": 5000.00,
        "count": 1,
        "averageAmount": 5000.00
      },
      {
        "type": "expense",
        "category": "Rent",
        "totalAmount": 1200.50,
        "count": 1,
        "averageAmount": 1200.50
      }
    ],
    "monthly_trends": [
      {
        "period": { "year": 2024, "month": 1 },
        "type": "income",
        "totalAmount": 5000.00,
        "count": 1
      }
    ],
    "insights": [
      {
        "type": "success",
        "title": "Positive Balance",
        "message": "Great job! You have a positive balance of $2799.50."
      }
    ]
  }
}
```

### Get Top Categories

```bash
curl -X GET http://localhost:3000/api/dashboard/top-categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Spending Trends

```bash
curl -X GET http://localhost:3000/api/dashboard/spending-trends \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## User Management Examples (Admin Only)

### Get All Users

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Update User Role

```bash
curl -X PUT http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "role": "admin",
    "status": "active"
  }'
```

### Toggle User Status

```bash
curl -X PATCH http://localhost:3000/api/users/507f1f77bcf86cd799439011/toggle-status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get User Statistics

```bash
curl -X GET http://localhost:3000/api/users/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Advanced MongoDB Features

### Aggregation Pipeline Examples

```bash
# Get monthly income vs expense trends
curl -X GET "http://localhost:3000/api/dashboard/spending-trends?period=monthly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get weekly spending patterns
curl -X GET "http://localhost:3000/api/dashboard/spending-trends?period=weekly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get yearly overview
curl -X GET "http://localhost:3000/api/dashboard/spending-trends?period=yearly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Complex Filtering

```bash
# Filter by amount range and date range
curl -X GET "http://localhost:3000/api/records?min_amount=100&max_amount=1000&date_from=2024-01-01&date_to=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by multiple categories
curl -X GET "http://localhost:3000/api/records?category=Food&category=Transport" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling Examples

### Validation Error

**Request:**
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": -100,
    "type": "invalid",
    "category": "",
    "date": "invalid-date"
  }'
```

**Response:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "amount",
      "message": "\"amount\" must be a positive number",
      "value": -100
    },
    {
      "field": "type",
      "message": "\"type\" must be one of [income, expense]",
      "value": "invalid"
    }
  ]
}
```

### Authentication Error

**Request:**
```bash
curl -X GET http://localhost:3000/api/records
```

**Response:**
```json
{
  "error": "Authentication required",
  "message": "Please provide a valid JWT token"
}
```

### Authorization Error

**Request:**
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VIEWER_JWT_TOKEN" \
  -d '{
    "amount": 100.00,
    "type": "income",
    "category": "Test",
    "date": "2024-01-15"
  }'
```

**Response:**
```json
{
  "error": "Access denied",
  "message": "You do not have permission to perform this action",
  "required": ["write:records"],
  "user_permissions": ["read:dashboard", "read:records"]
}
```

## Testing Workflow

### 1. Create Test Users

```bash
# Create Admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'

# Create Analyst user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst",
    "email": "analyst@example.com",
    "password": "analyst123",
    "role": "analyst"
  }'

# Create Viewer user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viewer",
    "email": "viewer@example.com",
    "password": "viewer123",
    "role": "viewer"
  }'
```

### 2. Login and Save Tokens

Login as each user and save their JWT tokens for testing.

### 3. Test Role-Based Access

Use each token to test different endpoints and verify access control works correctly.

### 4. Test Financial Operations

Create sample financial data to test dashboard and analytics features.

## MongoDB Compass Integration

1. **Connect** to your database: `mongodb://localhost:27017/finance_db`
2. **Explore** collections:
   - `users` - User accounts and roles
   - `financialrecords` - Financial transactions
3. **Monitor** query performance
4. **Visualize** aggregation pipelines

### Sample Queries in MongoDB Compass

```javascript
// Find all records for a user
db.financialrecords.find({ user_id: ObjectId("507f1f77bcf86cd799439011") })

// Calculate monthly totals
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

// Top spending categories
db.financialrecords.aggregate([
  { $match: { type: "expense" } },
  {
    $group: {
      _id: "$category",
      totalAmount: { $sum: "$amount" },
      count: { $sum: 1 }
    }
  },
  { $sort: { totalAmount: -1 } },
  { $limit: 10 }
])
```

## Postman Collection

You can import the following as a Postman collection for easy testing:

```json
{
  "info": {
    "name": "Finance Backend API - MongoDB",
    "description": "API collection for Finance Data Processing and Access Control Backend"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"analyst\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          }
        }
      ]
    }
  ]
}
```

This collection provides a starting point for testing the API endpoints. You can expand it with more endpoints and test cases as needed.
