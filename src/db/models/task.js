'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      // Relasi ke Campaign
      Task.belongsTo(models.Campaign, {
        foreignKey: 'campaign_id',
        as: 'campaign',
        onDelete: 'CASCADE',
      });

      // Relasi ke User (Influencer)
      Task.belongsTo(models.User, {
        foreignKey: 'influencer_id',
        as: 'influencer',
        onDelete: 'CASCADE',
      });
    }
  }

  Task.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      campaign_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      influencer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      submission_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Task',
      tableName: 'tasks',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['campaign_id'],
          name: 'idx_tasks_campaign_id',
        },
        {
          fields: ['influencer_id'],
          name: 'idx_tasks_influencer_id',
        },
        {
          fields: ['status'],
          name: 'idx_tasks_status',
        },
      ],
    }
  );

  return Task;
};