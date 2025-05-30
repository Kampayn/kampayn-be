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

    return successResponse(
      h,
      { user: newUser }, // newUser sudah menghormati defaultScope
      'User registered successfully. Please complete your profile to set a role.',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return Boom.badImplementation('Failed to register user');
  }
};

const login = async (request, h) => {
  const { email, password } = request.payload;
  const t = await sequelize.transaction(); // Mulai transaksi

  try {
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

    if (!user.role) {
      // return Boom.forbidden('Please complete your profile and set a role to login.');
      // atau biarkan login, tapi frontend harus menghandle ini.
      console.warn(`User ${user.email} logged in without a role.`);
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
      'Login successful'
    );
  } catch (error) {
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
// Placeholder for Google OAuth - this would be more complex
const googleLoginCallback = async (request, h) => {
  // This handler would be called by Google after user authentication.
  // It would receive an authorization code or tokens from Google.
  // 1. Exchange code for Google tokens (access, id_token).
  // 2. Get user profile from Google using id_token or access_token.
  // 3. Find or create user in your DB based on google_id or email.
  // 4. Generate your app's access and refresh tokens.
  // 5. Redirect user or return tokens.
  return h
    .response({ message: 'Google OAuth callback placeholder. Implement me!' })
    .code(200);
};

module.exports = {
  register,
  login,
  refreshToken,
  googleLoginCallback,
};
