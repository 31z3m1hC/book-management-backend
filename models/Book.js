// This defines what a "Book" Schema looks like in our database

const mongoose = require('mongoose');

// Create a blueprint for books
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true  
  },
  author: {
    type: String,
    required: true  
  },
  published: {
    type: Boolean,
    default: false  
  },
  rating: {
    type: Number,
    min: 0,        
    max: 5,        
    default: 0     
  },
  yearPublished: {
    type: Number,
    required: true  
  },
  isbn: {
    type: String,
    required: true, 
    unique: true    
  },
  content: {
    type: String,
    default: ''     
  }
}, {
  timestamps: true  
});

// export the model to use it elsewhere
module.exports = mongoose.model('Book', bookSchema);