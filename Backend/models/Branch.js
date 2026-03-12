const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Maganjo', 'Matugga'], // Strictly limited to the 2 specified locations 
    trim: true
  },
  locationDescription: {
    type: String,
    required: true,
    minlength: 2 // Alpha-numeric description 
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model where role is 'Manager' 
    required: true
  },
  contactNumber: {
    type: String,
    required: true // Valid phone number format 
  }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);