const Boom = require('@hapi/boom');
const {
  User,
  BrandProfile,
  InfluencerProfile,
  sequelize,
} = require('../db/models');
const { successResponse } = require('../utils/responseHelper'); // Impor response helper

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
    return successResponse(
      h,
      {
        user: user,
      },
      'Profile retrieved successfully'
    ); // Menggunakan response helper
  } catch (error) {
    console.error('Get profile error:', error);
    return Boom.badImplementation('Failed to retrieve profile');
  }
};

const completeProfile = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { role, category, photo_url, company, instagram_username,
    instagram_followers, instagram_avg_likes, instagram_avg_comments,
    instagram_engagement_rate } = request.payload;

  // Parse numeric values from payload
  const parsedInstagramFollowers = instagram_followers ? parseInt(instagram_followers, 10) : null;
  const parsedInstagramAvgLikes = instagram_avg_likes ? Math.round(parseFloat(instagram_avg_likes)) : null;
  const parsedInstagramAvgComments = instagram_avg_comments ? Math.round(parseFloat(instagram_avg_comments)) : null;
  const parsedInstagramEngagementRate = instagram_engagement_rate ? parseFloat(instagram_engagement_rate) : null;

  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return Boom.notFound('User not found');
    }

    if (user.role && user.role !== role) {
      // Handle jika user mencoba mengubah role yang sudah ada (jika tidak diizinkan)
      // Atau handle penghapusan profil lama jika role berubah
      await t.rollback();
      return Boom.conflict(
        'User role is already set and cannot be changed this way.'
      );
    }

    user.role = role;
    await user.save({ transaction: t });

    if (role === 'brand') {
      // Buat atau update BrandProfile
      // Cek apakah profil sudah ada
      let brandProfile = await BrandProfile.findOne({
        where: { user_id: userId },
        transaction: t,
      });
      if (brandProfile) {
        brandProfile.company = company; // dan field lain
        brandProfile.category = category;
        brandProfile.photo_url = photo_url;
        await brandProfile.save({ transaction: t });
      } else {
        brandProfile = await BrandProfile.create(
          {
            user_id: userId,
            company: company, // dan field lain
            category: category,
            photo_url: photo_url,
          },
          { transaction: t }
        );
      }
    } else if (role === 'influencer') {
      // Buat atau update InfluencerProfile
      let influencerProfile = await InfluencerProfile.findOne({
        where: { user_id: userId },
        transaction: t,
      });
      if (influencerProfile) {
        influencerProfile.instagram_username = instagram_username; // dan field lain
        influencerProfile.categories = Array.isArray(category)
          ? category
          : [category];
        influencerProfile.photo_url = photo_url;
        influencerProfile.instagram_followers = parsedInstagramFollowers;
        influencerProfile.instagram_avg_likes = parsedInstagramAvgLikes;
        influencerProfile.instagram_avg_comments = parsedInstagramAvgComments;
        influencerProfile.instagram_engagement_rate = parsedInstagramEngagementRate;
        // ...
        await influencerProfile.save({ transaction: t });
      } else {
        influencerProfile = await InfluencerProfile.create(
          {
            user_id: userId,
            instagram_username: instagram_username, // dan field lain
            categories: Array.isArray(category) ? category : [category],
            photo_url: photo_url,
            instagram_followers: parsedInstagramFollowers,
            instagram_avg_likes: parsedInstagramAvgLikes,
            instagram_avg_comments: parsedInstagramAvgComments,
            instagram_engagement_rate: parsedInstagramEngagementRate,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    // Ambil ulang user dengan profil yang ter-update
    const updatedUserWithProfile = await User.findByPk(userId, {
      include: [
        { model: BrandProfile, as: 'brandProfile' },
        { model: InfluencerProfile, as: 'influencerProfile' },
      ],
    });

    return successResponse(
      h,
      {
        user: updatedUserWithProfile,
      },
      'Profile completed successfully',
      201
    ); // Menggunakan response helper
  } catch (error) {
    await t.rollback();
    console.error('Complete profile error:', error);
    return Boom.badImplementation('Failed to complete profile');
  }
};

const getUserProfileById = async (request, h) => {
  const { userId } = request.params;
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
    return successResponse(
      h,
      {
        user: user,
      },
      'Profile retrieved successfully'
    );
  } catch (error) {
    console.error('Get user profile by ID error:', error);
    return Boom.badImplementation('Failed to retrieve user profile');
  }
};

module.exports = {
  getMyProfile,
  completeProfile,
  getUserProfileById,
};
