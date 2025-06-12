const userController = require('../controllers/userController');
const { completeProfilePayload } = require('../validations/userValidation');

module.exports = [
  {
    method: 'GET',
    path: '/api/v1/users/me',
    handler: userController.getMyProfile,
    options: {
      auth: 'jwt_access', // Requires JWT authentication
    },
  },
  {
    method: 'GET',
    path: '/api/v1/users/{userId}',
    handler: userController.getUserProfileById,
    options: {
      auth: 'jwt_access', // Requires JWT authentication
    },
  },
  {
    method: 'POST', // atau PUT
    path: '/api/v1/users/complete-profile',
    handler: userController.completeProfile,
    options: {
      auth: 'jwt_access',
      validate: {
        payload: completeProfilePayload,
      },
    },
  },
];
