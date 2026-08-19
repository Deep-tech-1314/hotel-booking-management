const AuditLog = require('../models/AuditLog');

// Write an immutable audit record. Best-effort: failures are logged, never thrown,
// so auditing can never break the action it is recording.
// Usage: logAudit(req, 'hotel.approved', 'Hotel', hotel._id, { before, after, meta })
const logAudit = async (req, action, entityType, entityId, { before, after, meta = {} } = {}) => {
  try {
    const actor = req && req.user ? req.user._id : undefined;
    const actorRole = req && req.user ? req.user.role : 'system';
    const ip = req ? (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress) : undefined;

    return await AuditLog.create({
      actor,
      actorRole,
      action,
      entityType,
      entityId,
      changes: { before, after },
      meta,
      ip,
    });
  } catch (err) {
    console.error('logAudit() failed:', err.message);
    return null;
  }
};

module.exports = { logAudit };
