# MongoDB Finance Backend Setup Script
Write-Host "=== Finance Backend MongoDB Setup ===" -ForegroundColor Green

# Check if MongoDB is installed
Write-Host "`n1. Checking MongoDB installation..." -ForegroundColor Yellow
try {
    $mongoVersion = mongosh --version 2>$null
    Write-Host "✅ MongoDB is installed: $mongoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}

# Setup package.json
Write-Host "`n2. Setting up package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Backup-File "package.json" -Destination "package-sqlite.json"
}
Copy-Item "package-mongo.json" "package.json" -Force
Write-Host "✅ package.json updated for MongoDB" -ForegroundColor Green

# Setup environment
Write-Host "`n3. Setting up environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Backup-File ".env" -Destination ".env-sqlite.bak"
}
Copy-Item ".env-mongo.example" ".env" -Force

# Check if MongoDB is running locally
Write-Host "`n4. Checking MongoDB service..." -ForegroundColor Yellow
try {
    $mongoStatus = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoStatus -and $mongoStatus.Status -eq 'Running') {
        Write-Host "✅ MongoDB service is running" -ForegroundColor Green
        $env:MONGODB_URI = "mongodb://localhost:27017/finance_db"
    } else {
        Write-Host "⚠️ MongoDB service is not running" -ForegroundColor Yellow
        Write-Host "Please start MongoDB service or use MongoDB Atlas" -ForegroundColor Yellow
        Write-Host "Update MONGODB_URI in .env file" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not check MongoDB service status" -ForegroundColor Yellow
    Write-Host "Please ensure MongoDB is running or use MongoDB Atlas" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`n5. Installing dependencies..." -ForegroundColor Yellow
npm install

# Seed database (if MongoDB is available)
Write-Host "`n6. Seeding database..." -ForegroundColor Yellow
try {
    npm run seed
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database seeding failed" -ForegroundColor Yellow
    Write-Host "Please check your MongoDB connection and run 'npm run seed' manually" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "To start the server:" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White
Write-Host "  or" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nAPI will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nSample user credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin@finance.com / admin123" -ForegroundColor White
Write-Host "  Analyst: analyst@finance.com / analyst123" -ForegroundColor White
Write-Host "  Viewer: viewer@finance.com / viewer123" -ForegroundColor White
