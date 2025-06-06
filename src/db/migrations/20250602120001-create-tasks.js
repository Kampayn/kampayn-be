'use strict';

const taskStatusEnumName = 'task_status_enum';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE ${taskStatusEnumName} AS ENUM (
        'pending',
        'approved',
        'rejected'
      );
    `);

    await queryInterface.createTable('tasks', {
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
      submission_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: `"${taskStatusEnumName}"`,
        allowNull: false,
        defaultValue: 'pending',
      },
      submitted_at: {
        allowNull: true,
        type: Sequelize.DATE,
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

    // Add index for better query performance
    await queryInterface.addIndex('tasks', {
      fields: ['campaign_id'],
      name: 'idx_tasks_campaign_id',
    });

    await queryInterface.addIndex('tasks', {
      fields: ['influencer_id'],
      name: 'idx_tasks_influencer_id',
    });

    await queryInterface.addIndex('tasks', {
      fields: ['status'],
      name: 'idx_tasks_status',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tasks');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS ${taskStatusEnumName};`);
  },
};