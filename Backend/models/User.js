const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2 // Common alphanumeric requirement [cite: 12]
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Director', 'Manager', 'Sales Agent'], // Specific roles mentioned 
    default: 'Sales Agent'
  },
  branch: {
    type: String,
    required: function() { return this.role !== 'Director'; }, // Director oversees all branches 
    enum: ['Maganjo', 'Matugga'], // Specified locations [cite: 9]
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);