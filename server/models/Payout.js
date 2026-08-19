const mongoose = require('mongoose');

// A disbursement of accumulated net earnings to a hotel owner.
const payoutSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  // Transactions covered by this payout (for reconciliation)
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
  periodStart: Date,
  periodEnd: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'paid', 'failed'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  paidAt: Date,
  referenceNumber: String,
  note: String,
}, {
  timestamps: true,
});

payoutSchema.index({ owner: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
