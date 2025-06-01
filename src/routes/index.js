const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const campaignRoutes = require('./campaignRoutes');

module.exports = [
  ...authRoutes,
  ...userRoutes,
  ...campaignRoutes,
  // Add other route modules here
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return { message: 'Welcome to the Kampaiyn API!' };
    },
    options: {
      auth: false,
    },
  },
];
