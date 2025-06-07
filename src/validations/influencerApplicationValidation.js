'use strict';
const Joi = require('joi');

const createApplicationPayload = Joi.object({
  campaign_id: Joi.string().uuid().required()
});

const updateApplicationStatusPayload = Joi.object({
  status: Joi.string().valid('applied', 'accepted', 'rejected').required()
});

const applicationQueryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort_by: Joi.string().valid('applied_at', 'created_at', 'updated_at').default('applied_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  status: Joi.string().valid('applied', 'accepted', 'rejected'),
  campaign_id: Joi.string().uuid(),
  influencer_id: Joi.string().uuid()
});

const applicationByIdParams = Joi.object({
  id: Joi.string().uuid().required()
});

const campaignApplicationsParams = Joi.object({
  campaign_id: Joi.string().uuid().required()
});

const campaignApplicationsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort_by: Joi.string().valid('applied_at', 'created_at', 'updated_at').default('applied_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  status: Joi.string().valid('applied', 'accepted', 'rejected')
});

module.exports = {
  createApplicationPayload,
  updateApplicationStatusPayload,
  applicationQueryParams,
  applicationByIdParams,
  campaignApplicationsParams,
  campaignApplicationsQuery
};