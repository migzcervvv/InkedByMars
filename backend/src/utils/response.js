'use strict';

/**
 * Standardized API response shape.
 * All controllers use these helpers for consistency.
 */

const sendSuccess = (res, statusCode, data = {}, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const sendCreated = (res, data = {}, message = 'Resource created') => {
  return sendSuccess(res, 201, data, message);
};

const sendOk = (res, data = {}, message = 'Success') => {
  return sendSuccess(res, 200, data, message);
};

const sendCookieWithToken = (res, admin) => {
  const token = admin.getSignedJwt();
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('token', token, cookieOptions);
  return token;
};

module.exports = { sendOk, sendCreated, sendCookieWithToken };
