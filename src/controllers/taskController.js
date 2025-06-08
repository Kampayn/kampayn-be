'use strict';
const Boom = require('@hapi/boom');
const {
  Task,
  Campaign,
  User,
  InfluencerProfile,
  InfluencerApplication,
  sequelize,
} = require('../db/models');
const { successResponse } = require('../utils/responseHelper');
const { Op } = require('sequelize');

// Submit or Create Task (Influencer only, for accepted influencers)
const submitOrCreateTask = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { campaign_id, submission_url } = request.payload;

  const t = await sequelize.transaction();
  try {
    // Verify user is an influencer
    const user = await User.findByPk(userId, { transaction: t });
    if (!user || user.role !== 'influencer') {
      await t.rollback();
      return Boom.forbidden('Only influencers can submit tasks');
    }

    // Check if campaign exists and is active
    const campaign = await Campaign.findByPk(campaign_id, { transaction: t });
    if (!campaign) {
      await t.rollback();
      return Boom.notFound('Campaign not found');
    }

    if (campaign.status !== 'active') {
      await t.rollback();
      return Boom.badRequest('Campaign is not active');
    }

    // Check if influencer has accepted application for this campaign
    const application = await InfluencerApplication.findOne({
      where: {
        campaign_id,
        influencer_id: userId,
        status: 'accepted',
      },
      transaction: t,
    });

    if (!application) {
      await t.rollback();
      return Boom.badRequest(
        'Influencer must have an accepted application for this campaign'
      );
    }

    // Check if task already exists
    const existingTask = await Task.findOne({
      where: {
        campaign_id,
        influencer_id: userId,
      },
      transaction: t,
    });

    let task;
    let isNewTask = false;

    if (existingTask) {
      // Update existing task
      await existingTask.update(
        {
          submission_url,
          submitted_at: new Date(),
          status: 'pending', // Reset to pending for review
        },
        { transaction: t }
      );
      task = existingTask;
    } else {
      // Create new task
      task = await Task.create(
        {
          campaign_id,
          influencer_id: userId,
          status: 'pending',
          submission_url,
          submitted_at: new Date(),
        },
        { transaction: t }
      );
      isNewTask = true;
    }

    await t.commit();

    const taskWithDetails = await Task.findByPk(task.id, {
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

    const message = isNewTask ? 'Task created and submitted successfully' : 'Task updated and resubmitted successfully';
    const statusCode = isNewTask ? 201 : 200;

    return successResponse(
      h,
      {
        task: taskWithDetails,
        isNewTask,
      },
      message,
      statusCode
    );
  } catch (error) {
    await t.rollback();
    console.error('Error submitting/creating task:', error);
    return Boom.internal('Failed to submit/create task');
  }
};

// Get All Tasks (with filters)
const getAllTasks = async (request, h) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
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

    const { count, rows } = await Task.findAndCountAll({
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
      message: 'Tasks retrieved successfully',
      data: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return Boom.internal('Failed to retrieve tasks');
  }
};

// Get Task by ID
const getTaskById = async (request, h) => {
  try {
    const { id } = request.params;

    const task = await Task.findByPk(id, {
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
            'content_dos',
            'content_donts',
            'key_message',
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

    if (!task) {
      return Boom.notFound('Task not found');
    }

    return successResponse(h, {
      message: 'Task retrieved successfully',
      data: task,
    });
  } catch (error) {
    console.error('Error getting task:', error);
    return Boom.internal('Failed to retrieve task');
  }
};



// Update Task Status (Brand only)
const updateTaskStatus = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { id } = request.params;
  const { status } = request.payload;

  const t = await sequelize.transaction();
  try {
    // Verify user is a brand
    const user = await User.findByPk(userId, { transaction: t });
    if (!user || user.role !== 'brand') {
      await t.rollback();
      return Boom.forbidden('Only brands can update task status');
    }

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
        },
      ],
      transaction: t,
    });

    if (!task) {
      await t.rollback();
      return Boom.notFound('Task not found');
    }

    // Check if user owns the campaign
    if (task.campaign.user_id !== userId) {
      await t.rollback();
      return Boom.forbidden('You can only update tasks for your own campaigns');
    }

    await task.update({ status }, { transaction: t });
    await t.commit();

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'campaign_name', 'campaign_type'],
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return successResponse(h, {
      message: 'Task status updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating task status:', error);
    return Boom.internal('Failed to update task status');
  }
};

// Get Tasks for a Campaign (Brand only)
const getCampaignTasks = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { campaign_id } = request.params;
  const {
    page = 1,
    limit = 10,
    sort_by = 'created_at',
    sort_order = 'DESC',
    status,
    influencer_id,
  } = request.query;

  try {
    // Verify user is a brand and owns the campaign
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'brand') {
      return Boom.forbidden('Only brands can view campaign tasks');
    }

    const campaign = await Campaign.findByPk(campaign_id);
    if (!campaign) {
      return Boom.notFound('Campaign not found');
    }

    if (campaign.user_id !== userId) {
      return Boom.forbidden('You can only view tasks for your own campaigns');
    }

    const offset = (page - 1) * limit;
    const whereClause = { campaign_id };
    if (status) whereClause.status = status;
    if (influencer_id) whereClause.influencer_id = influencer_id;

    const { count, rows: task } = await Task.findAndCountAll({
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

    const totalPages = Math.ceil(count / limit);

    return successResponse(
      h,
      {
        task,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
      'Campaign tasks retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting campaign tasks:', error);
    return Boom.internal('Failed to retrieve campaign tasks');
  }
};

// Get My Tasks (Influencer only)
const getMyTasks = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const {
    page = 1,
    limit = 10,
    sort_by = 'created_at',
    sort_order = 'DESC',
    status,
  } = request.query;

  try {
    // Verify user is an influencer
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'influencer') {
      return Boom.forbidden('Only influencers can view their tasks');
    }

    const offset = (page - 1) * limit;
    const whereClause = { influencer_id: userId };
    if (status) whereClause.status = status;

    const { count, rows } = await Task.findAndCountAll({
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
            'start_date',
            'end_date',
            'content_dos',
            'content_donts',
            'key_message',
          ],
        },
      ],
      order: [[sort_by, sort_order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return successResponse(h, {
      message: 'My tasks retrieved successfully',
      data: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error getting my tasks:', error);
    return Boom.internal('Failed to retrieve my tasks');
  }
};

// Update Task (General update - for submission_url and other fields)
const updateTask = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { id } = request.params;
  const updateData = request.payload;

  const t = await sequelize.transaction();
  try {
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
        },
      ],
      transaction: t,
    });

    if (!task) {
      await t.rollback();
      return Boom.notFound('Task not found');
    }

    const user = await User.findByPk(userId, { transaction: t });

    // Check permissions based on role
    if (user.role === 'influencer') {
      // Influencer can only update their own tasks and only submission_url
      if (task.influencer_id !== userId) {
        await t.rollback();
        return Boom.forbidden('You can only update your own tasks');
      }
      // Only allow submission_url updates for influencers
      if (Object.keys(updateData).some((key) => key !== 'submission_url')) {
        await t.rollback();
        return Boom.forbidden('Influencers can only update submission_url');
      }
      if (updateData.submission_url) {
        updateData.submitted_at = new Date();
      }
    } else if (user.role === 'brand') {
      // Brand can only update tasks for their own campaigns and only status
      if (task.campaign.user_id !== userId) {
        await t.rollback();
        return Boom.forbidden(
          'You can only update tasks for your own campaigns'
        );
      }
      // Only allow status updates for brands
      if (Object.keys(updateData).some((key) => key !== 'status')) {
        await t.rollback();
        return Boom.forbidden('Brands can only update task status');
      }
    } else {
      await t.rollback();
      return Boom.forbidden('Invalid user role');
    }

    await task.update(updateData, { transaction: t });
    await t.commit();

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'campaign_name', 'campaign_type'],
        },
        {
          model: User,
          as: 'influencer',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return successResponse(h, {
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating task:', error);
    return Boom.internal('Failed to update task');
  }
};

// Delete Task (Brand only)
const deleteTask = async (request, h) => {
  const userId = request.auth.credentials.user.id;
  const { id } = request.params;

  const t = await sequelize.transaction();
  try {
    // Verify user is a brand
    const user = await User.findByPk(userId, { transaction: t });
    if (!user || user.role !== 'brand') {
      await t.rollback();
      return Boom.forbidden('Only brands can delete tasks');
    }

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Campaign,
          as: 'campaign',
        },
      ],
      transaction: t,
    });

    if (!task) {
      await t.rollback();
      return Boom.notFound('Task not found');
    }

    // Check if user owns the campaign
    if (task.campaign.user_id !== userId) {
      await t.rollback();
      return Boom.forbidden('You can only delete tasks for your own campaigns');
    }

    await task.destroy({ transaction: t });
    await t.commit();

    return successResponse(h, {
      message: 'Task deleted successfully',
    });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting task:', error);
    return Boom.internal('Failed to delete task');
  }
};

module.exports = {
  submitOrCreateTask,
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  getCampaignTasks,
  getMyTasks,
  updateTask,
  deleteTask,
};
