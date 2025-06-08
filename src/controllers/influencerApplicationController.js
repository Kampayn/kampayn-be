'use strict';
const Boom = require('@hapi/boom');
const {
  InfluencerApplication,
  Campaign,
  User,
  InfluencerProfile,
  sequelize,
} = require('../db/models');
const { successResponse } = require('../utils/responseHelper');
const { Op } = require('sequelize');

// Create Application (Influencer applies to campaign)
const createApplication = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { campaign_id } = request.payload;

  const t = await sequelize.transaction();
  try {
    // Verify user is an influencer
    const user = await User.findByPk(userId, {
      include: [{ model: InfluencerProfile, as: 'influencerProfile' }],
      transaction: t,
    });

    if (!user || user.role !== 'influencer') {
      await t.rollback();
      return Boom.forbidden('Only influencers can apply to campaigns');
    }

    // Check if campaign exists and is active
    const campaign = await Campaign.findByPk(campaign_id, { transaction: t });
    if (!campaign) {
      await t.rollback();
      return Boom.notFound('Campaign not found');
    }

    if (campaign.status !== 'active' && campaign.status !== 'published') {
      await t.rollback();
      return Boom.badRequest('Campaign is not accepting applications');
    }

    // Check if already applied
    const existingApplication = await InfluencerApplication.findOne({
      where: {
        campaign_id,
        influencer_id: userId,
      },
      transaction: t,
    });

    if (existingApplication) {
      await t.rollback();
      return Boom.conflict('You have already applied to this campaign');
    }

    const application = await InfluencerApplication.create(
      {
        campaign_id,
        influencer_id: userId,
        status: 'applied',
      },
      { transaction: t }
    );

    await t.commit();

    const applicationWithDetails = await InfluencerApplication.findByPk(
      application.id,
      {
        include: [
          {
            model: Campaign,
            as: 'campaign',
            attributes: [
              'id',
              'campaign_name',
              'campaign_type',
              'budget',
              'currency',
            ],
          },
          {
            model: User,
            as: 'influencer',
            attributes: ['id', 'name', 'email'],
            include: [
              {
                model: InfluencerProfile,
                as: 'influencerProfile',
              },
            ],
          },
        ],
      }
    );

    return successResponse(
      h,
      { applicationWithDetails },
      'Application submitted successfully',
      201
    );
  } catch (error) {
    await t.rollback();
    console.error('Error creating application:', error);
    return Boom.internal('Failed to create application');
  }
};

// Get All Applications (with filters)
const getAllApplications = async (request, h) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'applied_at',
      sort_order = 'DESC',
      status,
      campaign_id,
      influencer_id,
    } = request.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (campaign_id) whereClause.campaign_id = campaign_id;
    if (influencer_id) whereClause.influencer_id = influencer_id;

    const { count, rows } = await InfluencerApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: [
            'id',
            'campaign_name',
            'campaign_type',
            'budget',
            'currency',
          ],
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: InfluencerProfile,
              as: 'influencerProfile',
            },
          ],
        },
      ],
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return successResponse(h, {
      message: 'Applications retrieved successfully',
      data: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error getting applications:', error);
    return Boom.internal('Failed to retrieve applications');
  }
};

// Get Application by ID
const getApplicationById = async (request, h) => {
  try {
    const { id } = request.params;

    const application = await InfluencerApplication.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: [
            'id',
            'campaign_name',
            'campaign_type',
            'budget',
            'currency',
          ],
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: InfluencerProfile,
              as: 'influencerProfile',
            },
          ],
        },
      ],
    });

    if (!application) {
      return Boom.notFound('Application not found');
    }

    return successResponse(h, {
      message: 'Application retrieved successfully',
      data: application,
    });
  } catch (error) {
    console.error('Error getting application:', error);
    return Boom.internal('Failed to retrieve application');
  }
};

// Update Application Status (Brand only)
const updateApplicationStatus = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { id } = request.params;
  const { status } = request.payload;

  const t = await sequelize.transaction();
  try {
    // Verify user is a brand
    const user = await User.findByPk(userId, { transaction: t });
    if (!user || user.role !== 'brand') {
      await t.rollback();
      return Boom.forbidden('Only brands can update application status');
    }

    const application = await InfluencerApplication.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
        },
      ],
      transaction: t,
    });

    if (!application) {
      await t.rollback();
      return Boom.notFound('Application not found');
    }

    // Check if user owns the campaign
    if (application.campaign.user_id !== userId) {
      await t.rollback();
      return Boom.forbidden(
        'You can only update applications for your own campaigns'
      );
    }

    await application.update({ status }, { transaction: t });
    await t.commit();

    const updatedApplication = await InfluencerApplication.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: [
            'id',
            'campaign_name',
            'campaign_type',
            'budget',
            'currency',
          ],
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: InfluencerProfile,
              as: 'influencerProfile',
            },
          ],
        },
      ],
    });

    return successResponse(
      h,
      {
        updatedApplication,
      },
      'Application status updated successfully'
    );
  } catch (error) {
    await t.rollback();
    console.error('Error updating application status:', error);
    return Boom.internal('Failed to update application status');
  }
};

// Get Applications for a Campaign (Brand only)
const getCampaignApplications = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { campaign_id } = request.params;
  const {
    page = 1,
    limit = 10,
    sort_by = 'applied_at',
    sort_order = 'DESC',
    status,
  } = request.query;

  try {
    // Verify user is a brand and owns the campaign
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'brand') {
      return Boom.forbidden('Only brands can view campaign applications');
    }

    const campaign = await Campaign.findByPk(campaign_id);
    if (!campaign) {
      return Boom.notFound('Campaign not found');
    }

    if (campaign.user_id !== userId) {
      return Boom.forbidden(
        'You can only view applications for your own campaigns'
      );
    }

    const offset = (page - 1) * limit;
    const whereClause = { campaign_id };
    if (status) whereClause.status = status;

    const { count, rows: application } =
      await InfluencerApplication.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'influencer',
            attributes: ['id', 'name', 'email'],
            include: [
              {
                model: InfluencerProfile,
                as: 'influencerProfile',
              },
            ],
          },
        ],
        order: [[sort_by, sort_order]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

    // return successResponse(h, {
    //   message: 'Campaign applications retrieved successfully',
    //   data: rows,
    //   pagination: {
    //     current_page: parseInt(page),
    //     per_page: parseInt(limit),
    //     total: count,
    //     total_pages: Math.ceil(count / limit),
    //   },
    // });

    const totalPages = Math.ceil(count / limit);

    return successResponse(
      h,
      {
        application,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
      'Campaign applications retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting campaign applications:', error);
    return Boom.internal('Failed to retrieve campaign applications');
  }
};

// Get My Applications (Influencer only)
const getMyApplications = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const {
    page = 1,
    limit = 10,
    sort_by = 'applied_at',
    sort_order = 'DESC',
    status,
  } = request.query;

  try {
    // Verify user is an influencer
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'influencer') {
      return Boom.forbidden('Only influencers can view their applications');
    }

    const offset = (page - 1) * limit;
    const whereClause = { influencer_id: userId };
    if (status) whereClause.status = status;

    const { count, rows: application } =
      await InfluencerApplication.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Campaign,
            as: 'campaign',
            attributes: [
              'id',
              'campaign_name',
              'campaign_type',
              'product_story',
              'platforms',
              'influencer_tiers',
              'content_types',
              'influencers_needed',
              'budget',
              'currency',
              'payment_method',
              'start_date',
              'end_date',
              'status',
              'createdAt',
            ],
          },
        ],
        order: [[sort_by, sort_order]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

    const totalPages = Math.ceil(count / limit);

    return successResponse(
      h,
      {
        application,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
      'My applications retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting my applications:', error);
    return Boom.internal('Failed to retrieve my applications');
  }
};

// Delete Application (Influencer only, only if status is 'applied')
const deleteApplication = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { id } = request.params;

  const t = await sequelize.transaction();
  try {
    const application = await InfluencerApplication.findByPk(id, {
      transaction: t,
    });

    if (!application) {
      await t.rollback();
      return Boom.notFound('Application not found');
    }

    // Check if user owns the application
    if (application.influencer_id !== userId) {
      await t.rollback();
      return Boom.forbidden('You can only delete your own applications');
    }

    // Only allow deletion if status is 'applied'
    if (application.status !== 'applied') {
      await t.rollback();
      return Boom.badRequest(
        'You can only delete applications that are still pending'
      );
    }

    await application.destroy({ transaction: t });
    await t.commit();

    return successResponse(
      h,
      {
        application_id: id,
      },
      'Application deleted successfully'
    );
  } catch (error) {
    await t.rollback();
    console.error('Error deleting application:', error);
    return Boom.internal('Failed to delete application');
  }
};

module.exports = {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  getCampaignApplications,
  getMyApplications,
  deleteApplication,
};
