'use strict';
const { v4: uuidv4 } = require('uuid'); // Untuk generate UUID jika diperlukan
const { hashPassword } = require('../../utils/passwordUtils'); // Sesuaikan path jika perlu

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = 'Password123!'; // Gunakan password yang sama untuk semua user demo
    const hashedPassword = await hashPassword(password);

    const usersToSeed = [
      // Brand Users
      {
        id: uuidv4(),
        name: 'Brand User Satu',
        email: 'brand1@example.com',
        password_hash: hashedPassword,
        role: 'brand', // Langsung set role untuk seeder
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Brand User Dua',
        email: 'brand2@example.com',
        password_hash: hashedPassword,
        role: 'brand',
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Brand User Tiga',
        email: 'brand3@example.com',
        password_hash: hashedPassword,
        role: 'brand',
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Influencer Users
      {
        id: uuidv4(),
        name: 'Influencer User Satu',
        email: 'influencer1@example.com',
        password_hash: hashedPassword,
        role: 'influencer', // Langsung set role untuk seeder
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Influencer User Dua',
        email: 'influencer2@example.com',
        password_hash: hashedPassword,
        role: 'influencer',
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Influencer User Tiga',
        email: 'influencer3@example.com',
        password_hash: hashedPassword,
        role: 'influencer',
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', usersToSeed, {});

    // Jika Anda ingin seeder juga membuat profil terkait:
    const brandUsers = usersToSeed.filter((u) => u.role === 'brand');
    const influencerUsers = usersToSeed.filter((u) => u.role === 'influencer');

    const brandProfilesToSeed = brandUsers.map((user) => ({
      id: uuidv4(),
      user_id: user.id,
      company: `${user.name}'s Company`, // Contoh nama perusahaan
      photo_url: 'https://picsum.photos/200', // Contoh URL foto profil,
      category: 'General', // Contoh kategori
      created_at: new Date(),
      updated_at: new Date(),
    }));

    const influencerProfilesToSeed = influencerUsers.map((user) => ({
      id: uuidv4(),
      user_id: user.id,
      instagram_username: user.email.split('@')[0], // Contoh username IG
      photo_url: 'https://picsum.photos/200', // Contoh URL foto profil,
      categories: JSON.stringify(['Lifestyle']), // Contoh kategori, pastikan format array TEXT[] benar untuk DB
      follower_tier: 'micro',
      created_at: new Date(),
      updated_at: new Date(),
    }));

    if (brandProfilesToSeed.length > 0) {
      await queryInterface.bulkInsert(
        'brand_profiles',
        brandProfilesToSeed,
        {}
      );
    }
    if (influencerProfilesToSeed.length > 0) {
      // Untuk TEXT[] di PostgreSQL, Sequelize mungkin memerlukan format khusus
      // atau Anda bisa menggunakan query mentah jika bulkInsert bermasalah dengan array.
      // Untuk kesederhanaan, kita coba dengan JSON.stringify, tapi ini mungkin perlu penyesuaian
      // tergantung bagaimana driver pg menangani array dari bulkInsert.
      // Jika categories adalah TEXT[], maka seharusnya ['Lifestyle'] bukan JSON.stringify(['Lifestyle'])
      // Mari kita coba langsung dengan array:
      const influencerProfilesCorrected = influencerUsers.map((user) => ({
        id: uuidv4(),
        user_id: user.id,
        instagram_username: user.email.split('@')[0],
        categories: ['Lifestyle', 'Food'], // Langsung array
        follower_tier: 'micro',
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await queryInterface.bulkInsert(
        'influencer_profiles',
        influencerProfilesCorrected,
        {}
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // // Hapus data dari tabel profil dulu karena ada foreign key constraint
    // await queryInterface.bulkDelete('brand_profiles', null, {});
    // await queryInterface.bulkDelete('influencer_profiles', null, {});
    // // Kemudian hapus data dari tabel users
    // await queryInterface.bulkDelete('users', null, {});
  },
};
