const authController = require('../controllers/authController');
const { registerPayload, loginPayload, refreshTokenPayload } = require('../validations/authValidation');

module.exports = [
  {
    method: 'POST',
    path: '/auth/register',
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
    path: '/auth/login',
    handler: authController.login,
    options: {
      validate: {
        payload: loginPayload,
      },
      auth: false, // No authentication needed for login
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh-token',
    handler: authController.refreshToken,
    options: {
        validate: {
            payload: refreshTokenPayload,
        },
        auth: false, // Typically, refresh token endpoint doesn't require access token
    },
  },
  // Placeholder for Google OAuth routes
  {
    method: 'GET', // Or POST, depending on your OAuth flow start
    path: '/auth/google',
    handler: (request, h) => {
        // Redirect to Google's OAuth consent screen
        // const googleOAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=email%20profile`;
        // return h.redirect(googleOAuthURL);
        return 'Redirect to Google OAuth. Set up client ID and redirect URI.';
    },
    options: {
        auth: false,
    },
  },
  {
    method: 'GET', // Or POST
    path: '/auth/google/callback',
    handler: authController.googleLoginCallback,
    options: {
        auth: false,
    },
  },
];
