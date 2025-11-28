
// Step 1: Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();  // Load .env variables

// Add these imports at the top of server.js (after existing imports)
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Step 2: Import Book model
//const Book = require('./models/Book');
const Book = require('./models/Book');


// Step 3: Create Express app
const app = express();
const PORT = process.env.PORT || 3000;


// Add this secret key after your other constants
const JWT_SECRET = process.env.JWT_SECRET || "MyApp!2025#ChangeThis$ToRandom";

// Step 4: Middleware (helps Express understand data)
app.use(cors());              // Allow requests from any website
app.use(express.json());      // Understand JSON data
app.use(express.static('public'));  // Serve your portfolio HTML

// Step 5: Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


// ============================================
// API ROUTES (Your Endpoints)
// ============================================

// HOME - Check if API is working
app.get('/api', (req, res) => {
  res.json({
    message: 'Book Management API is running!',
    endpoints: {
      getAll: 'GET /api/books',
      getOne: 'GET /api/books/:id',
      create: 'POST /api/books',
      update: 'PUT /api/books/:id',
      delete: 'DELETE /api/books/:id',
      search: 'GET /api/books/search/:query'
    }
  });
});


// GET ALL BOOKS
app.get('/api/books', async (req, res) => {
  try {
    // Find all books, newest first
    const books = await Book.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching books',
      error: error.message
    });
  }
});


// GET ONE BOOK BY ID
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    // If book doesn't exist
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching book',
      error: error.message
    });
  }
});


// CREATE NEW BOOK
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, published, rating, yearPublished, isbn } = req.body;
    
    // Check if required fields are provided
    if (!title || !author || !yearPublished || !isbn) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, author, yearPublished, and isbn'
      });
    }
    
    // Create new book
    const book = await Book.create({
      title,
      author,
      published: published || false,
      rating: rating || 0,
      yearPublished,
      isbn
    });
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully!',
      data: book
    });
  } catch (error) {
    // If ISBN already exists
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating book',
      error: error.message
    });
  }
});


// UPDATE BOOK
app.put('/api/books/:id', async (req, res) => {
  try {
    const { title, author, published, rating, yearPublished, isbn } = req.body;
    
    // Find and update book
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, published, rating, yearPublished, isbn },
      { new: true, runValidators: true }  // Return updated book & validate
    );
    
    // If book doesn't exist
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Book updated successfully!',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating book',
      error: error.message
    });
  }
});


// DELETE BOOK
app.delete('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    
    // If book doesn't exist
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Book deleted successfully!',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting book',
      error: error.message
    });
  }
});


// SEARCH BOOKS
app.get('/api/books/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    
    // Search in title, author, or ISBN (case-insensitive)
    const books = await Book.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
        { isbn: { $regex: searchQuery, $options: 'i' } }
      ]
    });
    
    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching books',
      error: error.message
    });
  }
});


// Add this middleware function after your existing middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// ============================================
// ADD THESE AUTHENTICATION ROUTES
// (Add after your existing routes, before app.listen)
// ============================================

// REGISTER - Create new user account
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    // Check if required fields are provided
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, password, and fullName'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Create new user (password will be hashed automatically by User model)
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: 'user' // Default role
    });
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

// LOGIN - Authenticate user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if credentials provided
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// GET PROFILE - Get current user info (Protected Route)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});


// UPDATE ADMIN PASSWORD (Protected Route)
app.put('/api/admin/update-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    // Only allow admins to update their password
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can update their password.'
      });
    }

    // Find the admin user
    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Set new password (will be hashed by pre('save') hook)
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin password updated successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating admin password',
      error: error.message
    });
  }
});




// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Portfolio at http://localhost:${PORT}`);
});



// ============================================
// QUICK REFERENCE
// ============================================
/*
To run this server:
1. Make sure MongoDB URI is in your .env file
2. Run: npm start
3. Test in browser: http://localhost:3000/api

To test with curl:
- Get all books:    curl http://localhost:3000/api/books
- Get one book:     curl http://localhost:3000/api/books/BOOK_ID
- Create book:      curl -X POST http://localhost:3000/api/books -H "Content-Type: application/json" -d '{"title":"Test Book","author":"John Doe","yearPublished":2024,"isbn":"123456"}'
- Update book:      curl -X PUT http://localhost:3000/api/books/BOOK_ID -H "Content-Type: application/json" -d '{"title":"Updated Title"}'
- Delete book:      curl -X DELETE http://localhost:3000/api/books/BOOK_ID
- Search books:     curl http://localhost:3000/api/books/search/gatsby
*/
