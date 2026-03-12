const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    buyerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    amountPaidUGX: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      required: true,
      enum: ['Cash', 'Mobile Money', 'Bank Transfer'],
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      enum: ['Maganjo', 'Matugga'],
    },
    recordedBy: {
      type: String,
      required: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
