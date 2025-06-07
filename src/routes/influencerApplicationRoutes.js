'use strict';
const influencerApplicationController = require('../controllers/influencerApplicationController');
const {
  createApplicationPayload,
  updateApplicationStatusPayload,
  applicationQueryParams,
  applicationByIdParams,
  campaignApplicationsParams,
  campaignApplicationsQuery
} = require('../validations/influencerApplicationValidation');

module.exports = [
  // Create Application (Influencer applies to campaign)
  {
    method: 'POST',
    path: '/api/v1/applications',
    handler: influencerApplicationController.createApplication,
    options: {
      auth: 'jwt_access',
      validate: {
        payload: createApplicationPayload
      }
    }
  },

  // Get All Applications (Admin/System level)
  {
    method: 'GET',
    path: '/api/v1/applications',
    handler: influencerApplicationController.getAllApplications,
    options: {
      auth: 'jwt_access',
      validate: {
        query: applicationQueryParams
      }
    }
  },

  // Get Application by ID
  {
    method: 'GET',
    path: '/api/v1/applications/{id}',
    handler: influencerApplicationController.getApplicationById,
    options: {
      auth: 'jwt_access',
      validate: {
        params: applicationByIdParams
      }
    }
  },

  // Update Application Status (Brand only)
  {
    method: 'PATCH',
    path: '/api/v1/applications/{id}/status',
    handler: influencerApplicationController.updateApplicationStatus,
    options: {
      auth: 'jwt_access',
      validate: {
        params: applicationByIdParams,
        payload: updateApplicationStatusPayload
      }
    }
  },

  // Get Applications for a Campaign (Brand only)
  {
    method: 'GET',
    path: '/api/v1/campaigns/{campaign_id}/applications',
    handler: influencerApplicationController.getCampaignApplications,
    options: {
      auth: 'jwt_access',
      validate: {
        params: campaignApplicationsParams,
        query: campaignApplicationsQuery
      }
    }
  },

  // Get My Applications (Influencer only)
  {
    method: 'GET',
    path: '/api/v1/my/applications',
    handler: influencerApplicationController.getMyApplications,
    options: {
      auth: 'jwt_access',
      validate: {
        query: applicationQueryParams
      }
    }
  },

  // Delete Application (Influencer only, only if status is 'applied')
  {
    method: 'DELETE',
    path: '/api/v1/applications/{id}',
    handler: influencerApplicationController.deleteApplication,
    options: {
      auth: 'jwt_access',
      validate: {
        params: applicationByIdParams
      }
    }
  }
];