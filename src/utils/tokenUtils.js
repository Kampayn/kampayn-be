const Jwt = require('@hapi/jwt');
let JwtService;

const initializeJwtService = (jwt) => {
  JwtService = jwt;
};

const {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenTtl,
  refreshTokenTtl,
} = require('../config/jwt');

const generateAccessToken = (payload) => {
  return JwtService.token.generate(
    { ...payload, aud: 'urn:audience:access', iss: 'urn:issuer:platform' },
    { key: accessTokenSecret, algorithm: 'HS256' },
    { ttlSec: parseTimeToSeconds(accessTokenTtl) }
  );
};

const generateRefreshToken = (payload) => {
  return JwtService.token.generate(
    { ...payload, aud: 'urn:audience:refresh', iss: 'urn:issuer:platform' },
    { key: refreshTokenSecret, algorithm: 'HS256' },
    { ttlSec: parseTimeToSeconds(refreshTokenTtl) }
  );
};

// Helper untuk parse TTL string (e.g., "15m", "7d") ke detik
const parseTimeToSeconds = (timeStr) => {
  if (typeof timeStr === 'number') return timeStr;
  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(0, -1), 10);
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 300; // default 5 menit
  }
};

const getExpiryDate = (ttlString) => {
  const seconds = parseTimeToSeconds(ttlString);
  return new Date(Date.now() + seconds * 1000);
};

const verifyToken = (token, secret) => {
  try {
    const decoded = JwtService.token.decode(token); // Cek struktur dulu
    if (!decoded || !decoded.decoded || !decoded.decoded.payload) {
      throw new Error('Invalid token structure');
    }
    JwtService.token.verify(decoded, secret); // Verifikasi signature dan expiry
    return { valid: true, expired: false, payload: decoded.decoded.payload };
  } catch (err) {
    if (err.message.includes('expired')) {
      return { valid: false, expired: true, payload: null };
    }
    return { valid: false, expired: false, payload: null, error: err.message };
  }
};

module.exports = {
  initializeJwtService,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  parseTimeToSeconds,
  getExpiryDate,
};
