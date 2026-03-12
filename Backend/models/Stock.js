const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // Deals in Beans, Grain Maize, Cow peas, G-nuts, Soybeans 
    enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'], 
    match: [/^[a-zA-Z0-9 ]+$/, 'Produce name must be alpha-numeric'] 
  },
  type: {
    type: String,
    required: true,
    minlength: 2, // Not less than 2 characters 
    match: [/^[a-zA-Z ]+$/, 'Type must be alphabets only']
  },
  branch: {
    type: String,
    required: true,
    enum: ['Maganjo', 'Matugga'] 
  },
  quantityKg: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  pricePerKg: {
    type: Number,
    required: true,
    min: 0 // Prices determined by manager 
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure we don't have duplicate produce entries for the same branch
produceSchema.index({ name: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Produce', produceSchema);