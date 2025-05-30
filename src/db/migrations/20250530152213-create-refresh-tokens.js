'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID, // Menggunakan UUID agar konsisten
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // Nama tabel users
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika user dihapus, tokennya juga ikut terhapus
      },
      token: {
        type: Sequelize.STRING(512), // Cukup panjang untuk token
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE, // TIMESTAMP
        allowNull: false,
      },
      issued_at: {
        // Sequelize akan handle ini jika kita set default value
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      is_valid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      device_info: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        // Kolom standar Sequelize
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        // Kolom standar Sequelize
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
