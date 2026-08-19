// Send JWT token in HTTP-only cookie
const sendToken = async (user, statusCode, res, message = '') => {
  // Generate tokens
  const accessToken = user.getAccessToken();
  const refreshToken = user.getRefreshToken();

  // Cookie options
  const accessCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  };

  const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Save refresh token to database
  try {
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.error('Failed to save refresh token:', err.message);
  }

  // Remove password from output
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  res
    .status(statusCode)
    .cookie('accessToken', accessToken, accessCookieOptions)
    .cookie('refreshToken', refreshToken, refreshCookieOptions)
    .json({
      success: true,
      message,
      user: userObj,
      accessToken, // Also send in body for mobile apps
    });
};

module.exports = sendToken;
