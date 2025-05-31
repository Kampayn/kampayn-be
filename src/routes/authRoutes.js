const authController = require('../controllers/authController');
const {
  registerPayload,
  loginPayload,
  refreshTokenPayload,
  googlePayload,
} = require('../validations/authValidation');

module.exports = [
  {
    method: 'POST',
    path: '/api/v1/auth/register',
    handler: authController.register,
    options: {
      validate: {
        payload: registerPayload,
      },
      auth: false, // No authentication needed for registration
    },
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    handler: authController.login,
    options: {
      validate: {
        payload: loginPayload,
      },
      auth: false, // No authentication needed for login
    },
  },
  {
    method: 'POST', // Or POST, depending on your OAuth flow start
    path: '/api/v1/auth/google',
    handler: authController.googleLogin,
    options: {
      validate: {
        payload: googlePayload,
      },
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/api/v1/auth/refresh-token',
    handler: authController.refreshToken,
    options: {
      validate: {
        payload: refreshTokenPayload,
      },
      auth: false, // Typically, refresh token endpoint doesn't require access token
    },
  },
];
