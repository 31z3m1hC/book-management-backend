// Step 1: Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Step 2: Import models

// Used to verfy logged in users and their roles
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Book = require('./models/Book');

// Step 3: Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

//Read JWT Secret from environment or use default(used to verify tokens issued by the server itself)
const JWT_SECRET = process.env.JWT_SECRET || "MyApp!2025#ChangeThis$ToRandom";

// Step 4: Middleware: Only allow requests from specific origins
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://chimezie-book-manager.netlify.app',  
    'https://book-manager-api-ym1o.onrender.com',
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Step 5: Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
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
// API ROUTES
// ============================================

// HOME - API Info
app.get('/api', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: 'Book Management API is running!',
      count: books.length,
      data: books,
      endpoints: {
        getAll: 'GET /api/books',
        getOne: 'GET /api/books/:id',
        create: 'POST /api/books (Admin only)',
        update: 'PUT /api/books/:id (Admin only)',
        delete: 'DELETE /api/books/:id (Admin only)',
        search: 'GET /api/books/search/:query',
        login: 'POST /api/login',
        register: 'POST /api/register',
        profile: 'GET /api/profile'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
});


// GET ALL BOOKS
app.get('/api/books', async (req, res) => {
  try {
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


// CREATE NEW BOOK (Admin only)
app.post('/api/books', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create books'
      });
    }

    const { title, author, published, rating, yearPublished, isbn } = req.body;
    
    if (!title || !author || !yearPublished || !isbn) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, author, yearPublished, and isbn'
      });
    }
    
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


// UPDATE BOOK (Admin only)
app.put('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update books'
      });
    }

    const { title, author, published, rating, yearPublished, isbn } = req.body;
    
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, published, rating, yearPublished, isbn },
      { new: true, runValidators: true }
    );
    
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


// DELETE BOOK (Admin only)
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete books'
      });
    }

    const book = await Book.findByIdAndDelete(req.params.id);
    
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


// ============================================
// AUTHENTICATION ROUTES
// ============================================

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, password, and fullName'
      });
    }
    
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: 'user'
    });
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '60d' }
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

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '60d' }
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

// GET PROFILE
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


// CHANGE ADMIN PASSWORD
app.put('/api/admin/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can update their password.'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    const isPasswordCorrect = await admin.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

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
  console.log('Server is running on http://localhost:' + PORT);
  console.log('Portfolio available at http://localhost:' + PORT + '/');
  console.log('API available at http://localhost:' + PORT + '/api');
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('  - https://chimezie-book-manager.netlify.app');
  console.log('  - https://book-manager-api-ym1o.onrender.com/');
});