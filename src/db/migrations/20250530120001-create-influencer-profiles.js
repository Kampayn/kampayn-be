'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('influencer_profiles', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      instagram_username: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      photo_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      categories: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
      follower_tier: {
        type: Sequelize.ENUM('nano', 'micro', 'macro', 'mega'),
        allowNull: true,
      },
      portfolio_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      instagram_followers: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      instagram_avg_likes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      instagram_avg_comments: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      instagram_engagement_rate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('influencer_profiles');
  }
};