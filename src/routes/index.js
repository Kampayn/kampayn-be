const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const campaignRoutes = require('./campaignRoutes');
const influencerRoutes = require('./influencerRoutes');
const influencerApplicationRoutes = require('./influencerApplicationRoutes');
const taskRoutes = require('./taskRoutes');

module.exports = [
  ...authRoutes,
  ...userRoutes,
  ...campaignRoutes,
  ...influencerRoutes,
  ...influencerApplicationRoutes,
  ...taskRoutes,
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
