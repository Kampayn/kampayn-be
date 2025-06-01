'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Campaign extends Model {
    static associate(models) {
      // User (Brand) yang membuat campaign
      Campaign.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'brandUser', // Alias untuk relasi
        // onDelete: 'CASCADE' sudah dihandle di level database oleh migrasi
      });

      // TODO: Jika ada tabel junction untuk Campaign dan Influencer (misal: campaign_applications atau campaign_participants)
      // Campaign.belongsToMany(models.User, {
      //   through: 'CampaignInfluencer', // Nama tabel junction
      //   foreignKey: 'campaign_id',
      //   otherKey: 'influencer_id',
      //   as: 'participatingInfluencers'
      // });
    }
  }
  Campaign.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    campaign_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    campaign_type: {
      type: DataTypes.ENUM( // Sequelize juga perlu tahu nilai ENUM ini
        'brand_awareness',
        'product_launch',
        'promo_sale',
        'other'
      ),
      allowNull: false,
    },
    product_story: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    key_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content_dos: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    content_donts: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    platforms: {
      type: DataTypes.ARRAY(DataTypes.STRING(50)),
      allowNull: false,
    },
    influencer_tiers: {
      type: DataTypes.ARRAY(DataTypes.STRING(10)),
      allowNull: false,
    },
    content_types: {
      type: DataTypes.ARRAY(DataTypes.STRING(20)),
      allowNull: false,
    },
    influencers_needed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'IDR',
    },
    payment_method: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM( // Sequelize juga perlu tahu nilai ENUM ini
        'draft',
        'published',
        'pending_review',
        'active',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'draft',
    },
    // createdAt dan updatedAt akan dihandle oleh timestamps: true
  }, {
    sequelize,
    modelName: 'Campaign',
    tableName: 'campaigns',
    timestamps: true,
    underscored: true,
  });
  return Campaign;
};