'use strict';
const Joi = require('joi');

const createTaskPayload = Joi.object({
  campaign_id: Joi.string().uuid().required(),
  submission_url: Joi.string().uri().allow(''),
});

const updateTaskPayload = Joi.object({
  submission_url: Joi.string().uri().allow(''),
  status: Joi.string().valid('pending', 'approved', 'rejected')
}).min(1);

const submitTaskPayload = Joi.object({
  submission_url: Joi.string().uri().required()
});

const updateTaskStatusPayload = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected').required()
});

const taskQueryParams = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort_by: Joi.string().valid('submitted_at', 'created_at', 'updated_at').default('created_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  status: Joi.string().valid('pending', 'approved', 'rejected'),
  campaign_id: Joi.string().uuid(),
  influencer_id: Joi.string().uuid()
});

const taskByIdParams = Joi.object({
  id: Joi.string().uuid().required()
});

const campaignTasksParams = Joi.object({
  campaign_id: Joi.string().uuid().required()
});

const campaignTasksQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort_by: Joi.string().valid('submitted_at', 'created_at', 'updated_at').default('created_at'),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  status: Joi.string().valid('pending', 'approved', 'rejected'),
  influencer_id: Joi.string().uuid()
});

module.exports = {
  createTaskPayload,
  updateTaskPayload,
  submitTaskPayload,
  updateTaskStatusPayload,
  taskQueryParams,
  taskByIdParams,
  campaignTasksParams,
  campaignTasksQuery
};