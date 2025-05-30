const userController = require('../controllers/userController');
const { completeProfilePayload } = require('../validations/userValidation');

module.exports = [
  {
    method: 'GET',
    path: '/users/me',
    handler: userController.getMyProfile,
    options: {
      auth: 'jwt_access', // Requires JWT authentication
    },
  },
  {
    method: 'POST', // atau PUT
    path: '/users/complete-profile',
    handler: userController.completeProfile,
    options: {
      auth: 'jwt_access',
      validate: {
        payload: completeProfilePayload,
      },
    },
  },
];
