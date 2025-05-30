'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InfluencerProfile extends Model {
    static associate(models) {
      InfluencerProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }
  InfluencerProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // table name
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    instagram_username: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    categories: { // Array of strings
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    follower_tier: {
      type: DataTypes.ENUM('nano', 'micro', 'macro', 'mega'),
      allowNull: true,
    },
    portfolio_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instagram_followers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    instagram_avg_likes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    instagram_avg_comments: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    instagram_engagement_rate: { // e.g., 0.025 for 2.5%
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'InfluencerProfile',
    tableName: 'influencer_profiles',
    timestamps: true,
    underscored: true, // Use snake_case for timestamps (created_at, updated_at)
  });
  return InfluencerProfile;
};
