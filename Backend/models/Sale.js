const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true,
    match: [/^[a-zA-Z0-9 ]+$/, 'Produce name must be alpha-numeric'] 
  },
  tonnageKg: {
    type: Number,
    required: true // Tonnage in kgs 
  },
  amountPaidUGX: {
    type: Number,
    required: true,
    min: 10000 // Not less than 5 characters/digits 
  },
  buyerName: {
    type: String,
    required: true,
    minlength: 2,
    match: [/^[a-zA-Z0-9 ]+$/, 'Buyer name must be alpha-numeric'] 
  },
  salesAgentName: {
    type: String,
    required: true,
    minlength: 2,
    match: [/^[a-zA-Z0-9 ]+$/, 'Agent name must be alpha-numeric']
  },
  branch: {
    type: String,
    required: true,
    enum: ['Maganjo', 'Matugga'] // Respective branch 
  },
  dateTime: {
    type: Date,
    default: Date.now // Date and time recorded 
  }
});

module.exports = mongoose.model('Sale', saleSchema);