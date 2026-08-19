const ApiError = require('../utils/ApiError');

// Gate an action behind a staff permission flag.
//   - admin: always allowed (platform-wide powers)
//   - owner: always allowed (owns the resource scope)
//   - staff: allowed only when their Staff record grants the flag and is active
//
// Staff records are introduced in the Staff module; until a logged-in user has an
// associated active Staff record, only owners/admins pass. Resource-level ownership
// (e.g. "this booking belongs to my hotel") is still enforced in the controllers.
exports.requirePermission = (flag) => async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError('Please login to access this resource', 401));
    }

    if (req.user.role === 'admin' || req.user.role === 'owner') {
      return next();
    }

    // Lazy-require so this middleware works before the Staff model is registered.
    let Staff;
    try {
      Staff = require('../models/Staff');
    } catch (e) {
      Staff = null;
    }

    if (Staff) {
      const staff = await Staff.findOne({ user: req.user._id, status: 'active' });
      if (staff && staff.permissions && staff.permissions[flag]) {
        // Expose the owner/hotel scope this staff member acts within
        req.staff = staff;
        return next();
      }
    }

    return next(new ApiError('You do not have permission to perform this action', 403));
  } catch (err) {
    return next(err);
  }
};
