'use strict';
const { Model } = require('sequelize');
const { hashPassword } = require('../../utils/passwordUtils');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.BrandProfile, {
        foreignKey: 'user_id',
        as: 'brandProfile',
        onDelete: 'CASCADE',
      });
      User.hasOne(models.InfluencerProfile, {
        foreignKey: 'user_id',
        as: 'influencerProfile',
        onDelete: 'CASCADE',
      });

      // Relasi ke InfluencerApplication (untuk influencer)
      User.hasMany(models.InfluencerApplication, {
        foreignKey: 'influencer_id',
        as: 'applications',
        onDelete: 'CASCADE',
      });

      // Relasi ke Task (untuk influencer)
      User.hasMany(models.Task, {
        foreignKey: 'influencer_id',
        as: 'tasks',
        onDelete: 'CASCADE',
      });

      // Relasi ke Campaign (untuk brand)
      User.hasMany(models.Campaign, {
        foreignKey: 'user_id',
        as: 'campaigns',
        onDelete: 'CASCADE',
      });

      // Relasi many-to-many ke Campaign melalui InfluencerApplication (untuk influencer)
      User.belongsToMany(models.Campaign, {
        through: models.InfluencerApplication,
        foreignKey: 'influencer_id',
        otherKey: 'campaign_id',
        as: 'appliedCampaigns',
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING, // VARCHAR(255) default
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: true, // Nullable for Google login
      },
      google_id: {
        type: DataTypes.STRING, // TEXT in postgres
        unique: true,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('brand', 'influencer'),
        allowNull: true,
      },
      email_verified_at: {
        type: DataTypes.DATE, // TIMESTAMP
        allowNull: true,
      },
      // Timestamps (createdAt, updatedAt) are added by default by Sequelize
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true, // Enable createdAt, updatedAt
      paranoid: true, // Enable soft deletes (uses deleted_at)
      underscored: true, // Use snake_case for timestamps (created_at, updated_at)
      defaultScope: {
        attributes: {
          exclude: ['password_hash', 'google_id', 'deleted_at', 'deletedAt'],
        },
      },
      scopes: {
        withSensitiveInfo: {
          // Scope untuk mengambil semua field jika diperlukan
          attributes: { include: ['password_hash', 'google_id', 'deleted_at'] },
        },
      },
      hooks: {
        async beforeCreate(user) {
          if (user.password_hash) {
            // Only hash if password is provided
            user.password_hash = await hashPassword(user.password_hash);
          }
        },
        async beforeUpdate(user) {
          // Hash password if it's changed and provided
          if (user.changed('password_hash') && user.password_hash) {
            user.password_hash = await hashPassword(user.password_hash);
          }
        },
      },
    }
  );
  return User;
};
