'use strict';

const campaignTypeEnumName = 'campaign_type_enum';
const campaignStatusEnumName = 'campaign_status_enum';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE ${campaignTypeEnumName} AS ENUM (
        'brand_awareness',
        'product_launch',
        'promo_sale',
        'other'
      );
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE ${campaignStatusEnumName} AS ENUM (
        'draft',
        'published',
        'pending_review',
        'active',
        'completed',
        'cancelled'
      );
    `);

    await queryInterface.createTable('campaigns', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        // User dengan role 'brand' yang membuat campaign
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // Nama tabel users
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      campaign_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      campaign_type: {
        type: campaignTypeEnumName, // Menggunakan nama ENUM yang sudah dibuat
        allowNull: false,
      },
      product_story: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      key_message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      content_dos: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
      },
      content_donts: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
      },
      platforms: {
        // Misal: ['Instagram', 'TikTok']
        type: Sequelize.ARRAY(Sequelize.STRING(50)),
        allowNull: false,
      },
      influencer_tiers: {
        // Misal: ['micro', 'nano']
        type: Sequelize.ARRAY(Sequelize.STRING(10)),
        allowNull: false,
      },
      content_types: {
        // Misal: ['feed_post', 'story', 'reels']
        type: Sequelize.ARRAY(Sequelize.STRING(20)),
        allowNull: false,
      },
      influencers_needed: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      budget: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'IDR',
      },
      payment_method: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY, // Hanya tanggal, tanpa waktu
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: campaignStatusEnumName, // Menggunakan nama ENUM yang sudah dibuat
        allowNull: false,
        defaultValue: 'draft',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE, // TIMESTAMP
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE, // TIMESTAMP
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('campaigns');

    await queryInterface.sequelize.query(`DROP TYPE ${campaignTypeEnumName};`);
    await queryInterface.sequelize.query(
      `DROP TYPE ${campaignStatusEnumName};`
    );
  },
};
