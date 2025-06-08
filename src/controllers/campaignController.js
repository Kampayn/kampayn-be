const Boom = require('@hapi/boom');
const { Campaign, User, BrandProfile, Task, InfluencerApplication, sequelize } = require('../db/models');
const { successResponse } = require('../utils/responseHelper');
const { Op } = require('sequelize');

// Create Campaign
const createCampaign = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const {
    campaign_name,
    campaign_type,
    product_story,
    key_message,
    content_dos,
    content_donts,
    platforms,
    influencer_tiers,
    content_types,
    influencers_needed,
    budget,
    currency,
    payment_method,
    start_date,
    end_date,
    status
  } = request.payload;

  const t = await sequelize.transaction();
  try {
    // Verify user is a brand
    const user = await User.findByPk(userId, {
      include: [{ model: BrandProfile, as: 'brandProfile' }],
      transaction: t
    });

    if (!user || user.role !== 'brand') {
      await t.rollback();
      return Boom.forbidden('Only brands can create campaigns');
    }

    const campaign = await Campaign.create({
      user_id: userId,
      campaign_name,
      campaign_type,
      product_story,
      key_message,
      content_dos,
      content_donts,
      platforms,
      influencer_tiers,
      content_types,
      influencers_needed,
      budget,
      currency: currency || 'IDR',
      payment_method,
      start_date,
      end_date,
      status: status || 'draft'
    }, { transaction: t });

    await t.commit();

    // Fetch campaign with brand user details
    const campaignWithDetails = await Campaign.findByPk(campaign.id, {
      include: [{
        model: User,
        as: 'brandUser',
        attributes: ['id', 'name', 'email'],
        include: [{ model: BrandProfile, as: 'brandProfile' }]
      }]
    });

    return successResponse(
      h,
      { campaign: campaignWithDetails },
      'Campaign created successfully',
      201
    );
  } catch (error) {
    await t.rollback();
    console.error('Create campaign error:', error);
    return Boom.badImplementation('Failed to create campaign');
  }
};

// Get All Campaigns with Pagination, Sorting, and Filtering
const getAllCampaigns = async (request, h) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
      status,
      campaign_type,
      search
    } = request.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['created_at', 'updated_at', 'campaign_name', 'start_date', 'end_date', 'budget'];
    const validSortOrders = ['ASC', 'DESC'];

    // Validate sort parameters
    const sortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    // Build where clause
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (campaign_type) {
      whereClause.campaign_type = campaign_type;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { campaign_name: { [Op.iLike]: `%${search}%` } },
        { product_story: { [Op.iLike]: `%${search}%` } },
        { key_message: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'brandUser',
        attributes: ['id', 'name', 'email'],
        include: [{ model: BrandProfile, as: 'brandProfile' }]
      }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    return successResponse(
      h,
      {
        campaigns,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        },
        filters: {
          status,
          campaign_type,
          search,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      },
      'Campaigns retrieved successfully'
    );
  } catch (error) {
    console.error('Get all campaigns error:', error);
    return Boom.badImplementation('Failed to retrieve campaigns');
  }
};

// Get Single Campaign with Role-based Response
const getCampaignById = async (request, h) => {
  try {
    const { id } = request.params;
    const userId = request.auth.credentials.user.id;
    const userRole = request.auth.credentials.user.role;
    const { for_role } = request.query; // 'influencer' or 'brand'

    const campaign = await Campaign.findByPk(id, {
      include: [
        {
          model: User,
          as: 'brandUser',
          attributes: ['id', 'name', 'email'],
          include: [{ model: BrandProfile, as: 'brandProfile' }]
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'influencer_id', 'status', 'submission_url', 'submitted_at', 'created_at', 'updated_at'],
          include: [
            {
              model: User,
              as: 'influencer',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: InfluencerApplication,
          as: 'applications',
          attributes: ['id', 'influencer_id', 'status', 'applied_at'],
          include: [
            {
              model: User,
              as: 'influencer',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!campaign) {
      return Boom.notFound('Campaign not found');
    }

    // Role-based response filtering
    let responseData = campaign.toJSON();

    if (for_role === 'influencer' || (userRole === 'influencer' && !for_role)) {
      // For influencers, hide sensitive brand information but include their task status
      const influencerTask = campaign.tasks?.find(task => task.influencer_id === userId);
      const influencerApplication = campaign.applications?.find(app => app.influencer_id === userId);
      
      responseData = {
        id: campaign.id,
        campaign_name: campaign.campaign_name,
        campaign_type: campaign.campaign_type,
        product_story: campaign.product_story,
        key_message: campaign.key_message,
        content_dos: campaign.content_dos,
        content_donts: campaign.content_donts,
        platforms: campaign.platforms,
        influencer_tiers: campaign.influencer_tiers,
        content_types: campaign.content_types,
        influencers_needed: campaign.influencers_needed,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status,
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
        brandUser: {
          id: campaign.brandUser.id,
          name: campaign.brandUser.name,
          brandProfile: {
            company: campaign.brandUser.brandProfile?.company,
            category: campaign.brandUser.brandProfile?.category
          }
        },
        // Include influencer's application status
        my_application: influencerApplication ? {
          id: influencerApplication.id,
          status: influencerApplication.status,
          applied_at: influencerApplication.applied_at
        } : null,
        // Include influencer's task status if they have one
        my_task: influencerTask ? {
          id: influencerTask.id,
          status: influencerTask.status,
          submission_url: influencerTask.submission_url,
          submitted_at: influencerTask.submitted_at,
          created_at: influencerTask.created_at,
          updated_at: influencerTask.updated_at
        } : null
      };
    } else if (for_role === 'brand' || (userRole === 'brand' && !for_role)) {
      // For brands, show all information including budget and payment details
      // Check if the requesting brand owns this campaign
      if (userRole === 'brand' && campaign.user_id !== userId) {
        // If not the owner, hide sensitive information
        delete responseData.budget;
        delete responseData.currency;
        delete responseData.payment_method;
      }
    }

    return successResponse(
      h,
      { campaign: responseData },
      'Campaign retrieved successfully'
    );
  } catch (error) {
    console.error('Get campaign by ID error:', error);
    return Boom.badImplementation('Failed to retrieve campaign');
  }
};

// Update Campaign
const updateCampaign = async (request, h) => {
  const { id } = request.params;
  const userId = request.auth.credentials.user.id;
  const updateData = request.payload;

  const t = await sequelize.transaction();
  try {
    const campaign = await Campaign.findByPk(id, { transaction: t });

    if (!campaign) {
      await t.rollback();
      return Boom.notFound('Campaign not found');
    }

    // Check if user owns this campaign
    if (campaign.user_id !== userId) {
      await t.rollback();
      return Boom.forbidden('You can only update your own campaigns');
    }

    // Update campaign
    await campaign.update(updateData, { transaction: t });
    await t.commit();

    // Fetch updated campaign with details
    const updatedCampaign = await Campaign.findByPk(id, {
      include: [{
        model: User,
        as: 'brandUser',
        attributes: ['id', 'name', 'email'],
        include: [{ model: BrandProfile, as: 'brandProfile' }]
      }]
    });

    return successResponse(
      h,
      { campaign: updatedCampaign },
      'Campaign updated successfully'
    );
  } catch (error) {
    await t.rollback();
    console.error('Update campaign error:', error);
    return Boom.badImplementation('Failed to update campaign');
  }
};

// Delete Campaign
const deleteCampaign = async (request, h) => {
  const { id } = request.params;
  const userId = request.auth.credentials.user.id;

  const t = await sequelize.transaction();
  try {
    const campaign = await Campaign.findByPk(id, { transaction: t });

    if (!campaign) {
      await t.rollback();
      return Boom.notFound('Campaign not found');
    }

    // Check if user owns this campaign
    if (campaign.user_id !== userId) {
      await t.rollback();
      return Boom.forbidden('You can only delete your own campaigns');
    }

    // Check if campaign can be deleted (e.g., not active)
    if (campaign.status === 'active') {
      await t.rollback();
      return Boom.conflict('Cannot delete an active campaign');
    }

    await campaign.destroy({ transaction: t });
    await t.commit();

    return successResponse(
      h,
      { campaign_id: id },
      'Campaign deleted successfully'
    );
  } catch (error) {
    await t.rollback();
    console.error('Delete campaign error:', error);
    return Boom.badImplementation('Failed to delete campaign');
  }
};

// Get My Campaigns (for authenticated brand)
const getMyCampaigns = async (request, h) => {
  try {
    const userId = request.auth.credentials.user.id;
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
      status
    } = request.query;

    const offset = (page - 1) * limit;
    const validSortFields = ['created_at', 'updated_at', 'campaign_name', 'start_date', 'end_date', 'budget'];
    const validSortOrders = ['ASC', 'DESC'];

    const sortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const whereClause = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    return successResponse(
      h,
      {
        campaigns,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      },
      'My campaigns retrieved successfully'
    );
  } catch (error) {
    console.error('Get my campaigns error:', error);
    return Boom.badImplementation('Failed to retrieve campaigns');
  }
};

module.exports = {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getMyCampaigns
};