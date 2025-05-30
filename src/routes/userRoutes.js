const userController = require('../controllers/userController');

module.exports = [
  {
    method: 'GET',
    path: '/users/me',
    handler: userController.getMyProfile,
    options: {
      auth: 'jwt_access', // Requires JWT authentication
    },
  },
];
