'use strict';
const taskController = require('../controllers/taskController');
const {
  createTaskPayload,
  updateTaskPayload,
  submitTaskPayload,
  updateTaskStatusPayload,
  taskQueryParams,
  taskByIdParams,
  campaignTasksParams,
  campaignTasksQuery
} = require('../validations/taskValidation');

module.exports = [
  // Create Task (Brand only, for accepted influencers)
  {
    method: 'POST',
    path: '/api/v1/tasks',
    handler: taskController.createTask,
    options: {
      auth: 'jwt_access',
      validate: {
        payload: createTaskPayload
      }
    }
  },

  // Get All Tasks (Admin/System level)
  {
    method: 'GET',
    path: '/api/v1/tasks',
    handler: taskController.getAllTasks,
    options: {
      auth: 'jwt_access',
      validate: {
        query: taskQueryParams
      }
    }
  },

  // Get Task by ID
  {
    method: 'GET',
    path: '/api/v1/tasks/{id}',
    handler: taskController.getTaskById,
    options: {
      auth: 'jwt_access',
      validate: {
        params: taskByIdParams
      }
    }
  },

  // Update Task (General update)
  {
    method: 'PATCH',
    path: '/api/v1/tasks/{id}',
    handler: taskController.updateTask,
    options: {
      auth: 'jwt_access',
      validate: {
        params: taskByIdParams,
        payload: updateTaskPayload
      }
    }
  },

  // Submit Task (Influencer only)
  {
    method: 'POST',
    path: '/api/v1/tasks/{id}/submit',
    handler: taskController.submitTask,
    options: {
      auth: 'jwt_access',
      validate: {
        params: taskByIdParams,
        payload: submitTaskPayload
      }
    }
  },

  // Update Task Status (Brand only)
  {
    method: 'PATCH',
    path: '/api/v1/tasks/{id}/status',
    handler: taskController.updateTaskStatus,
    options: {
      auth: 'jwt_access',
      validate: {
        params: taskByIdParams,
        payload: updateTaskStatusPayload
      }
    }
  },

  // Get Tasks for a Campaign (Brand only)
  {
    method: 'GET',
    path: '/api/v1/campaigns/{campaign_id}/tasks',
    handler: taskController.getCampaignTasks,
    options: {
      auth: 'jwt_access',
      validate: {
        params: campaignTasksParams,
        query: campaignTasksQuery
      }
    }
  },

  // Get My Tasks (Influencer only)
  {
    method: 'GET',
    path: '/api/v1/my/tasks',
    handler: taskController.getMyTasks,
    options: {
      auth: 'jwt_access',
      validate: {
        query: taskQueryParams
      }
    }
  },

  // Delete Task (Brand only)
  {
    method: 'DELETE',
    path: '/api/v1/tasks/{id}',
    handler: taskController.deleteTask,
    options: {
      auth: 'jwt_access',
      validate: {
        params: taskByIdParams
      }
    }
  }
];