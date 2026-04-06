const mongoose = require('mongoose');
const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await FinancialRecord.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = [
      {
        username: 'admin',
        email: 'admin@finance.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'analyst',
        email: 'analyst@finance.com',
        password: 'analyst123',
        role: 'analyst'
      },
      {
        username: 'viewer',
        email: 'viewer@finance.com',
        password: 'viewer123',
        role: 'viewer'
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'john123',
        role: 'analyst'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'jane123',
        role: 'viewer'
      }
    ];

    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create sample financial records
    const records = [];
    const categories = {
      income: ['Salary', 'Freelance', 'Investments', 'Business', 'Other Income'],
      expense: ['Rent', 'Groceries', 'Utilities', 'Transport', 'Entertainment', 'Healthcare', 'Shopping']
    };

    // Generate records for each user
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      
      // Generate 6 months of data
      for (let month = 0; month < 6; month++) {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - month);
        
        // Add income records
        records.push({
          user_id: user._id,
          amount: 3000 + Math.random() * 2000, // $3000-$5000
          type: 'income',
          category: 'Salary',
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
          description: 'Monthly salary'
        });

        // Add random income
        if (Math.random() > 0.5) {
          records.push({
            user_id: user._id,
            amount: 100 + Math.random() * 900, // $100-$1000
            type: 'income',
            category: categories.income[Math.floor(Math.random() * categories.income.length)],
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), Math.floor(Math.random() * 28) + 1),
            description: 'Additional income'
          });
        }

        // Add expense records
        const expenseCategories = categories.expense.slice(0, 4 + Math.floor(Math.random() * 3));
        expenseCategories.forEach(category => {
          const amount = category === 'Rent' ? 1200 + Math.random() * 800 : 
                        category === 'Groceries' ? 200 + Math.random() * 300 :
                        50 + Math.random() * 200;
          
          records.push({
            user_id: user._id,
            amount: amount,
            type: 'expense',
            category: category,
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), Math.floor(Math.random() * 28) + 1),
            description: `Monthly ${category.toLowerCase()}`
          });
        });
      }
    }

    const createdRecords = await FinancialRecord.create(records);
    console.log(`Created ${createdRecords.length} financial records`);

    // Display summary
    const summary = await FinancialRecord.getDashboardSummary(createdUsers[0]._id);
    console.log('\n=== Sample Data Summary ===');
    console.log(`Total Users: ${createdUsers.length}`);
    console.log(`Total Records: ${createdRecords.length}`);
    console.log(`Sample Dashboard Summary (Admin):`);
    console.log(`  Total Income: $${summary.totalIncome.toFixed(2)}`);
    console.log(`  Total Expenses: $${summary.totalExpenses.toFixed(2)}`);
    console.log(`  Net Balance: $${summary.netBalance.toFixed(2)}`);

    console.log('\n=== Sample User Credentials ===');
    createdUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()} - ${user.email}: ${user.role}123`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
