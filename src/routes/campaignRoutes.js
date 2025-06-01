const campaignController = require('../controllers/campaignController');
const {
  createCampaignPayload,
  updateCampaignPayload,
  campaignQueryParams,
  campaignByIdParams,
  campaignByIdQuery,
  myCampaignsQuery
} = require('../validations/campaignValidation');

module.exports = [
  // Create Campaign (Brand only)
  {
    method: 'POST',
    path: '/api/v1/campaigns',
    handler: campaignController.createCampaign,
    options: {
      auth: 'jwt_access',
      validate: {
        payload: createCampaignPayload
      }
    }
  },
  
  // Get All Campaigns (Public with pagination, sorting, filtering)
  {
    method: 'GET',
    path: '/api/v1/campaigns',
    handler: campaignController.getAllCampaigns,
    options: {
      auth: 'jwt_access',
      validate: {
        query: campaignQueryParams
      }
    }
  },
  
  // Get Single Campaign by ID (Role-based response)
  {
    method: 'GET',
    path: '/api/v1/campaigns/{id}',
    handler: campaignController.getCampaignById,
    options: {
      auth: 'jwt_access',
      validate: {
        params: campaignByIdParams,
        query: campaignByIdQuery
      }
    }
  },
  
  // Update Campaign (Owner only)
  {
    method: 'PUT',
    path: '/api/v1/campaigns/{id}',
    handler: campaignController.updateCampaign,
    options: {
      auth: 'jwt_access',
      validate: {
        params: campaignByIdParams,
        payload: updateCampaignPayload
      }
    }
  },
  
  // Delete Campaign (Owner only)
  {
    method: 'DELETE',
    path: '/api/v1/campaigns/{id}',
    handler: campaignController.deleteCampaign,
    options: {
      auth: 'jwt_access',
      validate: {
        params: campaignByIdParams
      }
    }
  },
  
  // Get My Campaigns (Authenticated brand's campaigns)
  {
    method: 'GET',
    path: '/api/v1/campaigns/my',
    handler: campaignController.getMyCampaigns,
    options: {
      auth: 'jwt_access',
      validate: {
        query: myCampaignsQuery
      }
    }
  }
];