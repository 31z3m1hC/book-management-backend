// initialSetup.js
// Quick setup script for first-time installation
// Creates default admin and sample users
// Usage: node initialSetup.js

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const initialSetup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log('Users already exist in the database!');
      console.log(`Found ${userCount} user(s).\n`);
      console.log('To manage existing users, use: node manageUsers.js\n');
      return;
    }

    console.log('═══════════════════════════════════════════════');
    console.log('     INITIAL SETUP - CREATING DEFAULT USERS');
    console.log('═══════════════════════════════════════════════\n');

    // Create admin user
    // Password will be automatically hashed by the pre('save') middleware
    const admin = await User.create({
      username: 'admin',
      email: 'admin@bookmanager.com',
      password: 'Admin@123',
      fullName: 'Administrator',
      role: 'admin'
    });
    console.log('Admin user created');

    // Create sample regular users
    const user1 = await User.create({
      username: 'andrew',
      email: 'john@example.com',
      password: 'John@123',
      fullName: 'Andrew Mezie',
      role: 'user'
    });
    console.log('User "john" created');

    const user2 = await User.create({
      username: 'jane',
      email: 'onmezie@gmail.com',
      password: 'Jane@123',
      fullName: 'Jane Smith',
      role: 'user'
    });
    console.log('User "jane" created');

    console.log('\n═══════════════════════════════════════════════');
    console.log('          SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('Default users created:\n');
    
    console.log('ADMIN ACCOUNT:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('   Role: admin');
    console.log('   Permissions: Can add, edit, and delete books\n');
    
    console.log('REGULAR USERS:');
    console.log('   Username: john | Password: John@123');
    console.log('   Username: jane | Password: Jane@123');
    console.log('   Role: user');
    console.log('   Permissions: Can only view, search, and filter books\n');
    
    console.log('═══════════════════════════════════════════════');
    console.log('IMPORTANT SECURITY NOTES:');
    console.log('═══════════════════════════════════════════════');
    console.log('1. Change all default passwords immediately!');
    console.log('2. Delete sample users if not needed');
    console.log('3. Use "node manageUsers.js" to manage users');
    console.log('4. All passwords are automatically hashed in database\n');

  } catch (error) {
    console.error('Error during setup:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

// Run the function
initialSetup();