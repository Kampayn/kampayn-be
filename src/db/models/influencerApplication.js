'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InfluencerApplication extends Model {
    static associate(models) {
      // Relasi ke Campaign
      InfluencerApplication.belongsTo(models.Campaign, {
        foreignKey: 'campaign_id',
        as: 'campaign',
        onDelete: 'CASCADE',
      });

      // Relasi ke User (Influencer)
      InfluencerApplication.belongsTo(models.User, {
        foreignKey: 'influencer_id',
        as: 'influencer',
        onDelete: 'CASCADE',
      });
    }
  }

  InfluencerApplication.init(
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
      status: {
        type: DataTypes.ENUM('applied', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'applied',
      },
      applied_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'InfluencerApplication',
      tableName: 'influencer_applications',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['campaign_id', 'influencer_id'],
          name: 'unique_campaign_influencer_application',
        },
      ],
    }
  );

  return InfluencerApplication;
};