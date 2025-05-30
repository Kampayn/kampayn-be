const Joi = require('joi');

const completeProfilePayload = Joi.object({
    role: Joi.string().valid('brand', 'influencer').required(),
    // Accept either string or array of strings for category
    category: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).required(),
    photo_url: Joi.string().uri().required(),

    // Brand specific
    company: Joi.string().when('role', { is: 'brand', then: Joi.required(), otherwise: Joi.optional() }),
    brand_photo_url: Joi.string().uri().when('role', { is: 'brand', then: Joi.optional(), otherwise: Joi.optional() }),

    // Influencer specific
    instagram_username: Joi.string().when('role', { is: 'influencer', then: Joi.optional(), otherwise: Joi.optional() }),
    instagram_followers: Joi.number().when('role', { is: 'influencer', then: Joi.optional(), otherwise: Joi.optional() }),
    instagram_avg_likes: Joi.number().when('role', { is: 'influencer', then: Joi.optional(), otherwise: Joi.optional() }),
    instagram_avg_comments: Joi.number().when('role', { is: 'influencer', then: Joi.optional(), otherwise: Joi.optional() }),
    instagram_engagement_rate: Joi.number().when('role', { is: 'influencer', then: Joi.optional(), otherwise: Joi.optional() }),
    follower_tier: Joi.string().when('role', { is: 'influencer', then: Joi.optional(), otherwise: Joi.optional() }),
    portfolio_url: Joi.string().uri().when('role', { is: 'influencer', then: Joi.optional(), otherwise: Joi.optional() }),
}).or('company', 'instagram_username'); // Minimal salah satu data profil ada jika role dipilih

module.exports = {
    completeProfilePayload,
};
