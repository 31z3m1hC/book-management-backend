// This defines what a "Book" looks like in our database

const mongoose = require('mongoose');

// Create a blueprint for books
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true  // Must have a title
  },
  author: {
    type: String,
    required: true  // Must have an author
  },
  published: {
    type: Boolean,
    default: false  // Is the book published? Default: no
  },
  rating: {
    type: Number,
    min: 0,        // Minimum rating: 0
    max: 5,        // Maximum rating: 5
    default: 0     // Default rating: 0
  },
  yearPublished: {
    type: Number,
    required: true  // Must have a year
  },
  isbn: {
    type: String,
    required: true, // Must have ISBN
    unique: true    // Each ISBN must be unique
  }
}, {
  timestamps: true  // Automatically add createdAt and updatedAt
});


module.exports = mongoose.model('Book', bookSchema);