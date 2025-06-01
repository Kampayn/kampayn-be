const Joi = require('joi');

const createCampaignPayload = Joi.object({
  campaign_name: Joi.string().min(3).max(255).required(),
  campaign_type: Joi.string().valid('brand_awareness', 'product_launch', 'promo_sale', 'other').required(),
  product_story: Joi.string().required(),
  key_message: Joi.string().required(),
  content_dos: Joi.array().items(Joi.string()).min(1).required(),
  content_donts: Joi.array().items(Joi.string()).min(1).required(),
  platforms: Joi.array().items(Joi.string().max(50)).min(1).required(),
  influencer_tiers: Joi.array().items(Joi.string().max(10)).min(1).required(),
  content_types: Joi.array().items(Joi.string().max(20)).min(1).required(),
  influencers_needed: Joi.number().integer().min(1).required(),
  budget: Joi.number().positive().precision(2).required(),
  currency: Joi.string().length(3).default('IDR'),
  payment_method: Joi.string().max(100).required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
  status: Joi.string().valid('draft', 'published', 'pending_review', 'active', 'completed', 'cancelled').default('draft')
});

const updateCampaignPayload = Joi.object({
  campaign_name: Joi.string().min(3).max(255),
  campaign_type: Joi.string().valid('brand_awareness', 'product_launch', 'promo_sale', 'other'),
  product_story: Joi.string(),
  key_message: Joi.string(),
  content_dos: Joi.array().items(Joi.string()).min(1),
  content_donts: Joi.array().items(Joi.string()).min(1),
  platforms: Joi.array().items(Joi.string().max(50)).min(1),
  influencer_tiers: Joi.array().items(Joi.string().max(10)).min(1),
  content_types: Joi.array().items(Joi.string().max(20)).min(1),
  influencers_needed: Joi.number().integer().min(1),
  budget: Joi.number().positive().precision(2),
  currency: Joi.string().length(3),
  payment_method: Joi.string().max(100),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().when('start_date', {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref('start_date')),
    otherwise: Joi.date()
  }),
  status: Joi.string().valid('draft', 'published', 'pending_review', 'active', 'completed', 'cancelled')
}).min(1); // At least one field must be provided for update

const campaignQueryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort_by: Joi.string().valid('created_at', 'updated_at', 'campaign_name', 'start_date', 'end_date', 'budget').default('created_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  status: Joi.string().valid('draft', 'published', 'pending_review', 'active', 'completed', 'cancelled'),
  campaign_type: Joi.string().valid('brand_awareness', 'product_launch', 'promo_sale', 'other'),
  search: Joi.string().min(1).max(255)
});

const campaignByIdParams = Joi.object({
  id: Joi.string().uuid().required()
});

const campaignByIdQuery = Joi.object({
  for_role: Joi.string().valid('influencer', 'brand')
});

const myCampaignsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort_by: Joi.string().valid('created_at', 'updated_at', 'campaign_name', 'start_date', 'end_date', 'budget').default('created_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  status: Joi.string().valid('draft', 'published', 'pending_review', 'active', 'completed', 'cancelled')
});

module.exports = {
  createCampaignPayload,
  updateCampaignPayload,
  campaignQueryParams,
  campaignByIdParams,
  campaignByIdQuery,
  myCampaignsQuery
};