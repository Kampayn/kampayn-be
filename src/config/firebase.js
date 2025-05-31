require('dotenv').config();
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

const firebaseServiceAccountPath = path.resolve(__dirname, "../../", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return admin;
  }

  // Check if the service account file exists before initializing
  if (!fs.existsSync(firebaseServiceAccountPath)) {
    throw new Error(
      `Firebase service account file not found at ${firebaseServiceAccountPath}`
    );
  }

  try {
    const serviceAccount = require(firebaseServiceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully.');
    return admin;
  } catch (error) {
    throw new Error(`Error initializing Firebase Admin SDK: ${error.message}`);
  }
};

module.exports = {
  firebaseServiceAccountPath,
  initializeFirebase,
  getFirebaseAdmin: () => {
    if (!firebaseInitialized) {
      throw new Error('Firebase Admin SDK not initialized. Call initializeFirebase() first.');
    }
    return admin;
  },
};
