const Boom = require('@hapi/boom');
const { User, RefreshToken, sequelize } = require('../db/models'); // Tambahkan RefreshToken
const { comparePassword } = require('../utils/passwordUtils');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getExpiryDate, // Impor helper baru
} = require('../utils/tokenUtils');
const { refreshTokenSecret, refreshTokenTtl } = require('../config/jwt'); // Impor refreshTokenTtl
const { verifyFirebaseToken } = require('../utils/firebase'); // Impor fungsi verifikasi Firebase
const { successResponse } = require('../utils/responseHelper'); // Impor response helper

const register = async (request, h) => {
  const { name, email, password } = request.payload;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return Boom.conflict('Email already in use');
    }

    // Password will be hashed by the model's hook
    const newUser = await User.create({
      name,
      email,
      password_hash: password, // Pass plain password to be hashed by hook
    });

    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      email_verified_at: newUser.email_verified_at,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
    };

    return successResponse(
      h,
      { user: userResponse }, // newUser sudah menghormati defaultScope
      'User registered successfully. Please verify your email.',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return Boom.badImplementation('Failed to register user');
  }
};

const login = async (request, h) => {
  const { email, password, idToken } = request.payload;
  const t = await sequelize.transaction(); // Mulai transaksi

  try {
    const decodedToken = await verifyFirebaseToken(idToken);
    // Cek apakah pengguna sudah terdaftar dengan Google
    if (!decodedToken) {
      return Boom.unauthorized('Invalid or expired ID token');
    }

    // Cek apakah email sudah verified
    if (!decodedToken.email_verified) {
      return Boom.unauthorized('Email not verified');
    }
    
    const user = await User.scope('withSensitiveInfo').findOne({
      where: { email },
      transaction: t,
    });
    if (!user || !user.password_hash) {
      // Check if user exists and has a password (not Google-only user)
      return Boom.unauthorized('Invalid email or password');
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return Boom.unauthorized('Invalid email or password');
    }

    // Cek apakah email pengguna sama dengan email dari token Google
    if (user.email !== decodedToken.email) {
      return Boom.unauthorized('Email from token does not match user email');
    }

    // Cek apakah email sudah diverifikasi
    if (!user.email_verified_at) {
      user.email_verified_at = new Date();
      await user.save({ transaction: t });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ id: user.id }); // Refresh token might only need user ID

    // Simpan refresh token ke database
    await RefreshToken.create(
      {
        user_id: user.id,
        token: newRefreshToken,
        expires_at: getExpiryDate(refreshTokenTtl),
        ip_address: request.info.remoteAddress,
        user_agent: request.headers['user-agent'] || null,
        // device_info bisa diisi jika ada logic untuk mendeteksinya
      },
      { transaction: t }
    );

    await t.commit(); // Commit transaksi

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      email_verified_at: user.email_verified_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return successResponse(
      h,
      {
        user: userResponse,
        accessToken: accessToken,
        refreshToken: newRefreshToken,
      },
      `Welcome back, ${user.name}!`
    );
  } catch (error) {
    await t.rollback(); // Rollback jika ada error
    console.error('Login error:', error);
    return Boom.badImplementation('Login failed');
  }
};

const refreshToken = async (request, h) => {
  const { refreshToken: oldRefreshToken } = request.payload;
  const t = await sequelize.transaction(); // Mulai transaksi

  if (!oldRefreshToken) {
    return Boom.badRequest('Refresh token is required');
  }

  try {
    const refreshTokenInstance = await RefreshToken.findOne({
      where: { token: oldRefreshToken },
      include: [{ model: User, as: 'user' }], // Sertakan user data
      transaction: t,
    });

    if (!refreshTokenInstance) {
      await t.rollback();
      return Boom.unauthorized('Invalid refresh token (not found)');
    }

    if (!refreshTokenInstance.is_valid) {
      await t.rollback();
      return Boom.unauthorized('Refresh token has been invalidated');
    }

    if (new Date(refreshTokenInstance.expires_at) < new Date()) {
      // Tandai token lama sebagai tidak valid jika sudah expired
      refreshTokenInstance.is_valid = false;
      await refreshTokenInstance.save({ transaction: t });
      await t.commit();
      return Boom.unauthorized('Refresh token expired');
    }

    const user = refreshTokenInstance.user;
    if (!user || user.deleted_at) {
      // Cek apakah user masih ada / aktif
      // Tandai token sebagai tidak valid jika user tidak valid
      refreshTokenInstance.is_valid = false;
      await refreshTokenInstance.save({ transaction: t });
      await t.commit();
      return Boom.unauthorized(
        'User associated with token not found or inactive'
      );
    }

    // (Opsional) Implementasi deteksi penggunaan ulang token yang sudah dirotasi
    // Jika token ini seharusnya sudah tidak valid karena sudah ada yang baru,
    // maka ini bisa jadi indikasi penyalahgunaan.

    // Invalidate token lama
    refreshTokenInstance.is_valid = false;
    await refreshTokenInstance.save({ transaction: t });

    // Buat access token baru
    const userPayload = { id: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(userPayload);

    // Buat refresh token baru (rotasi token)
    const newRefreshTokenString = generateRefreshToken({ id: user.id });
    await RefreshToken.create(
      {
        user_id: user.id,
        token: newRefreshTokenString,
        expires_at: getExpiryDate(refreshTokenTtl),
        ip_address: request.info.remoteAddress,
        user_agent: request.headers['user-agent'] || null,
      },
      { transaction: t }
    );

    await t.commit(); // Commit transaksi

    return successResponse(
      h,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshTokenString,
      },
      'Tokens refreshed successfully'
    );
  } catch (error) {
    await t.rollback(); // Rollback jika ada error
    console.error('Refresh token error:', error);
    return Boom.badImplementation('Failed to refresh token');
  }
};

// TODO: Implement Google OAuth callback handler
const googleLogin = async (request, h) => {
  const { idToken } = request.payload;
  const t = await sequelize.transaction(); // Mulai transaksi

  try {
    // Decode Google's ID token
    const decodedToken = await verifyFirebaseToken(idToken);
    const { uid, email, name } = decodedToken;

    // Cari pengguna berdasarkan email dan google_id
    let user = await User.findOne({
      where: { email },
      transaction: t,
    });

    // Jika pengguna belum ada, buat baru
    if (!user) {
      user = await User.create(
        {
          name,
          email,
          google_id: uid,
          email_verified_at: new Date(),
        },
        { transaction: t }
      );
    }
    // Jika pengguna sudah ada, tetapi belum memiliki google_id, update dengan google_id
    else if (!user.google_id) {
      user.google_id = uid;
      user.email_verified_at = new Date();
      await user.save({ transaction: t });
    }
    // Generate access and refresh tokens
    const userPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: user.id });
    // Simpan refresh token ke database
    await RefreshToken.create(
      {
        user_id: user.id,
        token: refreshToken,
        expires_at: getExpiryDate(refreshTokenTtl),
        ip_address: request.info.remoteAddress,
        user_agent: request.headers['user-agent'] || null,
        // device_info bisa diisi jika ada logic untuk mendeteksinya
      },
      { transaction: t }
    );

    await t.commit(); // Commit transaksi
    return successResponse(
      h,
      {
        user: user,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
      'Google login successful'
    );
  } catch (error) {
    await t.rollback(); // Rollback jika ada error
    console.error('Google login error:', error);
    return Boom.badImplementation('Google login failed');
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  googleLogin,
};
