const influencerController = require('../controllers/influencerController');

module.exports = [
  {
    method: 'GET',
    path: '/api/v1/influencer/{username}',
    handler: influencerController.getInstagramInfluencerData,
    options: {
      auth: 'jwt_access',
    },
  }
];
