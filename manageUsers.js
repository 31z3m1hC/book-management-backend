// manageUsers.js
// Script to manage users and their roles
// Usage: node manageUsers.js

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => readline.question(query, resolve));

// Validate password format
const isValidPassword = (password) => {
  const hasLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasLength && hasLetter && hasNumber && hasSpecial;
};

const manageUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    let running = true;

    while (running) {
      console.log('═══════════════════════════════════════════════');
      console.log('         USER MANAGEMENT SYSTEM');
      console.log('═══════════════════════════════════════════════');
      console.log('1. Create new user');
      console.log('2. List all users');
      console.log('3. Update user role');
      console.log('4. Update user password');
      console.log('5. Delete user');
      console.log('6. Exit');
      console.log('═══════════════════════════════════════════════\n');

      const choice = await question('Select an option (1-6): ');

      switch (choice) {
        case '1':
          await createUser();
          break;
        case '2':
          await listUsers();
          break;
        case '3':
          await updateUserRole();
          break;
        case '4':
          await updateUserPassword();
          break;
        case '5':
          await deleteUser();
          break;
        case '6':
          running = false;
          console.log('\nGoodbye!\n');
          break;
        default:
          console.log('\nInvalid option. Please try again.\n');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    readline.close();
    mongoose.connection.close();
  }
};

// Create new user
const createUser = async () => {
  try {
    console.log('\n--- CREATE NEW USER ---\n');
    
    const username = await question('Username: ');
    const email = await question('Email: ');
    const password = await question('Password (min 6 chars, letter+number+special): ');
    const fullName = await question('Full Name: ');
    const role = await question('Role (admin/user) [default: user]: ') || 'user';

    // Validate password
    if (!isValidPassword(password)) {
      console.log('\nPassword must be at least 6 characters with letters, numbers, and special characters\n');
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      console.log('\nUser with this username or email already exists!\n');
      return;
    }

    // Validate role
    if (role !== 'admin' && role !== 'user') {
      console.log('\nInvalid role. Must be "admin" or "user"\n');
      return;
    }

    // Create user - password will be hashed by the pre('save') middleware
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role
    });

    console.log('\nUser created successfully!');
    console.log('═══════════════════════════════════');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Full Name:', user.fullName);
    console.log('Role:', user.role);
    console.log('═══════════════════════════════════\n');

  } catch (error) {
    console.error('\nError creating user:', error.message, '\n');
  }
};

// List all users
const listUsers = async () => {
  try {
    console.log('\n--- ALL USERS ---\n');
    
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('No users found.\n');
      return;
    }

    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('Username\t\tRole\t\tEmail\t\t\t\tFull Name');
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    users.forEach(user => {
      const username = user.username.padEnd(16);
      const role = user.role.padEnd(12);
      const email = user.email.padEnd(32);
      console.log(`${username}${role}${email}${user.fullName}`);
    });
    
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(`Total users: ${users.length}\n`);

  } catch (error) {
    console.error('\nError listing users:', error.message, '\n');
  }
};

// Update user role
const updateUserRole = async () => {
  try {
    console.log('\n--- UPDATE USER ROLE ---\n');
    
    const username = await question('Enter username: ');
    const user = await User.findOne({ username });

    if (!user) {
      console.log('\nUser not found!\n');
      return;
    }

    console.log(`\nCurrent role: ${user.role}`);
    const newRole = await question('New role (admin/user): ');

    if (newRole !== 'admin' && newRole !== 'user') {
      console.log('\nInvalid role. Must be "admin" or "user"\n');
      return;
    }

    user.role = newRole;
    await user.save();

    console.log('\nUser role updated successfully!');
    console.log('═══════════════════════════════════');
    console.log('Username:', user.username);
    console.log('New Role:', user.role);
    console.log('═══════════════════════════════════\n');

  } catch (error) {
    console.error('\nError updating role:', error.message, '\n');
  }
};

// Update user password
const updateUserPassword = async () => {
  try {
    console.log('\n--- UPDATE USER PASSWORD ---\n');
    
    const username = await question('Enter username: ');
    const user = await User.findOne({ username });

    if (!user) {
      console.log('\nUser not found!\n');
      return;
    }

    const newPassword = await question('Enter new password (min 6 chars, letter+number+special): ');
    
    // Validate password
    if (!isValidPassword(newPassword)) {
      console.log('\nPassword must be at least 6 characters with letters, numbers, and special characters\n');
      return;
    }
    
    // Set new password - will be hashed by pre('save') middleware
    user.password = newPassword;
    await user.save();

    console.log('\nPassword updated successfully for user:', username, '\n');

  } catch (error) {
    console.error('\nError updating password:', error.message, '\n');
  }
};

// Delete user
const deleteUser = async () => {
  try {
    console.log('\n--- DELETE USER ---\n');
    
    const username = await question('Enter username to delete: ');
    const user = await User.findOne({ username });

    if (!user) {
      console.log('\nUser not found!\n');
      return;
    }

    console.log('\nUser details:');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Full Name:', user.fullName);
    
    const confirm = await question('\nAre you sure you want to delete this user? (yes/no): ');

    if (confirm.toLowerCase() === 'yes') {
      await User.findByIdAndDelete(user._id);
      console.log('\nUser deleted successfully!\n');
    } else {
      console.log('\nDeletion cancelled.\n');
    }

  } catch (error) {
    console.error('\nError deleting user:', error.message, '\n');
  }
};

// Run the function
manageUsers();