const mongoose = require('mongoose');

// Compatibility model for routes/controllers that still use "Produce".
const produceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    pricePerKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

produceSchema.index({ name: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Produce', produceSchema);
