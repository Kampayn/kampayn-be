const Boom = require('@hapi/boom');
const { User, BrandProfile, InfluencerProfile, sequelize } = require('../db/models');
const { comparePassword } = require('../utils/passwordUtils');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/tokenUtils');
const { refreshTokenSecret } = require('../config/jwt');


const register = async (request, h) => {
  const { name, email, password, role } = request.payload;
  const t = await sequelize.transaction();
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
      role,
    }, { transaction: t });

    if (role === 'brand') {
      // For now, create an empty profile. You might want more details at registration.
      await BrandProfile.create({ user_id: newUser.id, company: `${name}'s Company` /* Placeholder */ }, { transaction: t });
    } else if (role === 'influencer') {
      // For now, create an empty profile.
      await InfluencerProfile.create({ user_id: newUser.id }, { transaction: t });
    }

    await t.commit();

    // Exclude password_hash from the response
    const userResponse = newUser.toJSON();
    delete userResponse.password_hash;
    delete userResponse.deleted_at;


    return h.response({
      message: 'User registered successfully',
      user: userResponse,
    }).code(201);

  } catch (error) {
    await t.rollback();
    console.error('Registration error:', error);
    return Boom.badImplementation('Failed to register user');
  }
};

const login = async (request, h) => {
  const { email, password } = request.payload;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password_hash) { // Check if user exists and has a password (not Google-only user)
      return Boom.unauthorized('Invalid email or password');
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return Boom.unauthorized('Invalid email or password');
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ id: user.id }); // Refresh token might only need user ID

    // TODO: Store refresh token securely (e.g., in DB associated with user, or httpOnly cookie)
    // For now, just returning it.

    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    delete userResponse.deleted_at;

    return h.response({
      message: 'Login successful',
      user: userResponse,
      accessToken,
      refreshToken: newRefreshToken,
    }).code(200);

  } catch (error) {
    console.error('Login error:', error);
    return Boom.badImplementation('Login failed');
  }
};

const refreshToken = async (request, h) => {
    const { refreshToken: oldRefreshToken } = request.payload;

    if (!oldRefreshToken) {
        return Boom.badRequest('Refresh token is required');
    }

    const verificationResult = verifyToken(oldRefreshToken, refreshTokenSecret);

    if (!verificationResult.valid) {
        if (verificationResult.expired) {
            return Boom.unauthorized('Refresh token expired');
        }
        return Boom.unauthorized('Invalid refresh token');
    }

    const userId = verificationResult.payload.id;
    const user = await User.findByPk(userId);

    if (!user || user.deleted_at) {
        return Boom.unauthorized('User not found or inactive');
    }

    // TODO: Implement refresh token reuse detection if desired
    // (e.g., check if this refresh token has been used before)

    const userPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };

    const newAccessToken = generateAccessToken(userPayload);
    // Optionally, generate a new refresh token (for rotation)
    // const newRefreshToken = generateRefreshToken({ id: user.id });

    return h.response({
        accessToken: newAccessToken,
        // refreshToken: newRefreshToken, // if rotating
    }).code(200);
};


// Placeholder for Google OAuth - this would be more complex
const googleLoginCallback = async (request, h) => {
    // This handler would be called by Google after user authentication.
    // It would receive an authorization code or tokens from Google.
    // 1. Exchange code for Google tokens (access, id_token).
    // 2. Get user profile from Google using id_token or access_token.
    // 3. Find or create user in your DB based on google_id or email.
    // 4. Generate your app's access and refresh tokens.
    // 5. Redirect user or return tokens.
    return h.response({ message: 'Google OAuth callback placeholder. Implement me!' }).code(200);
};


module.exports = {
  register,
  login,
  refreshToken,
  googleLoginCallback,
};
