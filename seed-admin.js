const mongoose = require('mongoose');

// library that encrypts passwords 
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  fullName: String,
  role: String
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    await User.create({
      username: 'admin',
      email: 'admin@bookstore.com',
      password: 'admin123',
      fullName: 'Administrator',
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    // Create a regular test user
    await User.create({
      username: 'testuser',
      email: 'test@bookstore.com',
      password: 'test123',
      fullName: 'Test User',
      role: 'user'
    });

    console.log('\nTest user created successfully!');
    console.log('Username: testuser');
    console.log('Password: test123');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

createAdminUser();