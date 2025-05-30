const Boom = require('@hapi/boom');
const { User, BrandProfile, InfluencerProfile } = require('../db/models');

const getMyProfile = async (request, h) => {
  const userId = request.auth.credentials.user.id; // From JWT
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'deleted_at'] },
      include: [
        { model: BrandProfile, as: 'brandProfile' },
        { model: InfluencerProfile, as: 'influencerProfile' },
      ],
    });

    if (!user) {
      return Boom.notFound('User not found');
    }
    return h.response(user).code(200);
  } catch (error) {
    console.error('Get profile error:', error);
    return Boom.badImplementation('Failed to retrieve profile');
  }
};

module.exports = {
  getMyProfile,
};
