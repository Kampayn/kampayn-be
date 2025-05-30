'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BrandProfile extends Model {
    static associate(models) {
      BrandProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }
  BrandProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      onDelete: 'CASCADE',
    },
    company: {
      type: DataTypes.STRING, // VARCHAR(255)
      allowNull: false,
    },
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100), // VARCHAR(100)
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'BrandProfile',
    tableName: 'brand_profiles',
    timestamps: true,
    underscored: true, // Use snake_case for timestamps (created_at, updated_at)
  });
  return BrandProfile;
};
