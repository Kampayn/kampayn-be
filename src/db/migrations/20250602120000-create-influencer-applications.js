'use strict';

const applicationStatusEnumName = 'application_status_enum';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE ${applicationStatusEnumName} AS ENUM (
        'applied',
        'accepted',
        'rejected'
      );
    `);

    await queryInterface.createTable('influencer_applications', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'campaigns',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      influencer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: `"${applicationStatusEnumName}"`,
        allowNull: false,
        defaultValue: 'applied',
      },
      applied_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
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

    // Add unique constraint to prevent duplicate applications
    await queryInterface.addIndex('influencer_applications', {
      fields: ['campaign_id', 'influencer_id'],
      unique: true,
      name: 'unique_campaign_influencer_application',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('influencer_applications');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS ${applicationStatusEnumName};`);
  },
};