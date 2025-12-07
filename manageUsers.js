// manageUsers.js
// A command-line tool to manage users in a MongoDB database.
// Features: create user, list users, change role, change password, delete user.
// Usage: Ensure MONGODB_URI is set in .env file.
// Run: node manageUsers.js

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => readline.question(query, resolve));

// Check if password is strong enough
function checkPassword(password) {
  const hasLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasLength && hasLetter && hasNumber && hasSpecial;
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    let running = true;

    while (running) {
      console.log('----------------------------------');
      console.log('USER MANAGEMENT');
      console.log('----------------------------------');
      console.log('1. Create user');
      console.log('2. List users');
      console.log('3. Change role');
      console.log('4. Change password');
      console.log('5. Delete user');
      console.log('6. Exit');
      console.log('----------------------------------\n');

      const choice = await ask('Choose option (1-6): ');

      switch (choice) {
        case '1':
          await createUser();
          break;
        case '2':
          await listUsers();
          break;
        case '3':
          await changeRole();
          break;
        case '4':
          await changePassword();
          break;
        case '5':
          await deleteUser();
          break;
        case '6':
          running = false;
          console.log('\nBye!\n');
          break;
        default:
          console.log('\nInvalid choice\n');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    readline.close();
    mongoose.connection.close();
  }
}

async function createUser() {
  try {
    console.log('\n--- Create User ---\n');
    
    const username = await ask('Username: ');
    const email = await ask('Email: ');
    const password = await ask('Password: ');
    const fullName = await ask('Full Name: ');
    const role = await ask('Role (admin/user) [user]: ') || 'user';

    if (!checkPassword(password)) {
      console.log('\nPassword too weak (need 6+ chars, letter, number, special char)\n');
      return;
    }

    // Check if username/email already taken
    const existing = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existing) {
      console.log('\nUsername or email already exists\n');
      return;
    }

    if (role !== 'admin' && role !== 'user') {
      console.log('\nRole must be admin or user\n');
      return;
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role
    });

    console.log('\nUser created!');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('');

  } catch (error) {
    console.error('\nError:', error.message, '\n');
  }
}

async function listUsers() {
  try {
    console.log('\n--- All Users ---\n');
    
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('No users found\n');
      return;
    }

    console.log('Username\t\tRole\t\tEmail');
    console.log('--------------------------------------------------');
    
    users.forEach(user => {
      console.log(`${user.username.padEnd(20)}${user.role.padEnd(12)}${user.email}`);
    });
    
    console.log(`\nTotal: ${users.length}\n`);

  } catch (error) {
    console.error('\nError:', error.message, '\n');
  }
}

async function changeRole() {
  try {
    console.log('\n--- Change Role ---\n');
    
    const username = await ask('Username: ');
    const user = await User.findOne({ username });

    if (!user) {
      console.log('\nUser not found\n');
      return;
    }

    console.log(`Current role: ${user.role}`);
    const newRole = await ask('New role (admin/user): ');

    if (newRole !== 'admin' && newRole !== 'user') {
      console.log('\nInvalid role\n');
      return;
    }

    user.role = newRole;
    await user.save();

    console.log('\nRole updated!');
    console.log('Username:', user.username);
    console.log('New role:', user.role);
    console.log('');

  } catch (error) {
    console.error('\nError:', error.message, '\n');
  }
}

async function changePassword() {
  try {
    console.log('\n--- Change Password ---\n');
    
    const username = await ask('Username: ');
    const user = await User.findOne({ username });

    if (!user) {
      console.log('\nUser not found\n');
      return;
    }

    const newPassword = await ask('New password: ');
    
    if (!checkPassword(newPassword)) {
      console.log('\nPassword too weak\n');
      return;
    }
    
    user.password = newPassword;
    await user.save();

    console.log('\nPassword updated!\n');

  } catch (error) {
    console.error('\nError:', error.message, '\n');
  }
}

async function deleteUser() {
  try {
    console.log('\n--- Delete User ---\n');
    
    const username = await ask('Username: ');
    const user = await User.findOne({ username });

    if (!user) {
      console.log('\nUser not found\n');
      return;
    }

    console.log('\nUser info:');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    
    const confirm = await ask('\nDelete? (yes/no): ');

    if (confirm.toLowerCase() === 'yes') {
      await User.findByIdAndDelete(user._id);
      console.log('\nUser deleted\n');
    } else {
      console.log('\nCancelled\n');
    }

  } catch (error) {
    console.error('\nError:', error.message, '\n');
  }
}

main();