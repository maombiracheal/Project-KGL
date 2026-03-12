const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true,
    trim: true,
    // Alpha-numeric requirement 
    match: [/^[a-zA-Z0-9 ]+$/, 'Produce name must be alpha-numeric']
  },
  produceType: {
    type: String,
    required: true,
    minlength: 2, // Not less than 2 characters 
    match: [/^[a-zA-Z ]+$/, 'Produce type must contain alphabets only'] // Alphabets only 
  },
  tonnageKg: {
    type: Number,
    required: true,
    min: 1000, // Not less than a tonne (1000kg) 
  },
  costUGX: {
    type: Number,
    required: true,
    min: 10000, // Not less than 5 characters/digits 
  },
  dealerName: {
    type: String,
    required: true,
    minlength: 2, // Not less than 2 characters 
    match: [/^[a-zA-Z0-9 ]+$/, 'Dealer name must be alpha-numeric'] 
  },
  dealerContact: {
    type: String,
    required: true, // Valid phone numbers 
  },
  branchName: {
    type: String,
    required: true,
    enum: ['Maganjo', 'Matugga'], // KGL has two branches
  },
  sellingPricePerKg: {
    type: Number,
    required: true, // Price determined by manager 
  },
  procurementDate: {
    type: Date,
    required: true,
    default: Date.now // Date and time of produce 
  },
 
}, { timestamps: true });

module.exports = mongoose.model('Procurement', procurementSchema);