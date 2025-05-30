const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');

module.exports = [
  ...authRoutes,
  ...userRoutes,
  // Add other route modules here
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return { message: 'Welcome to the Kampaiyn API!' };
    },
    options: {
        auth: false,
    }
  },
];
