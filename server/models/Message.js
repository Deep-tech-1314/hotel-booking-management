const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
}, {
  timestamps: true,
});

messageSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
