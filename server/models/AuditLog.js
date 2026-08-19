const mongoose = require('mongoose');

// Immutable record of a significant action taken in the platform.
// Written by services/auditService.logAudit – never updated after creation.
const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  actorRole: {
    type: String,
    enum: ['user', 'owner', 'admin', 'system'],
    default: 'system',
  },
  // Dotted action name, e.g. 'hotel.approved', 'booking.checked-in', 'settings.updated'
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    enum: ['User', 'Hotel', 'Room', 'Booking', 'Review', 'Payout', 'Transaction', 'Staff', 'PlatformSettings', 'Coupon'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  // Snapshot of relevant fields before/after, plus any extra context
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip: String,
}, {
  timestamps: true,
});

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
