const Joi = require('joi');

const registerPayload = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginPayload = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenPayload = Joi.object({
    refreshToken: Joi.string().required(),
});

module.exports = {
  registerPayload,
  loginPayload,
  refreshTokenPayload,
};
