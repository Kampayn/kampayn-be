const { getFirebaseAdmin } = require('../config/firebase');

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token to verify
 * @returns {Promise<Object>} Decoded token object
 * @throws {Error} If token is invalid or expired
 */
async function verifyFirebaseToken(idToken) {
  try {
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    throw new Error('Invalid or expired Firebase ID token.');
  }
}

/**
 * Get user by UID from Firebase Auth
 * @param {string} uid - User UID
 * @returns {Promise<Object>} User record
 * @throws {Error} If user not found or other error
 */
async function getUserByUid(uid) {
  try {
    const admin = getFirebaseAdmin();
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw new Error('User not found or error retrieving user data.');
  }
}

/**
 * Create custom token for user
 * @param {string} uid - User UID
 * @param {Object} additionalClaims - Additional claims to include in token
 * @returns {Promise<string>} Custom token
 * @throws {Error} If token creation fails
 */
async function createCustomToken(uid, additionalClaims = {}) {
  try {
    const admin = getFirebaseAdmin();
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create custom token.');
  }
}

/**
 * Update user claims
 * @param {string} uid - User UID
 * @param {Object} customClaims - Custom claims to set
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 */
async function setCustomUserClaims(uid, customClaims) {
  try {
    const admin = getFirebaseAdmin();
    await admin.auth().setCustomUserClaims(uid, customClaims);
  } catch (error) {
    console.error('Error setting custom user claims:', error);
    throw new Error('Failed to update user claims.');
  }
}

module.exports = {
  verifyFirebaseToken,
  getUserByUid,
  createCustomToken,
  setCustomUserClaims,
};