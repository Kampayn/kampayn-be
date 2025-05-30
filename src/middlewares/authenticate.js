const { accessTokenSecret } = require('../config/jwt');

const validateJwt = async (artifacts, request, h) => {
  // artifacts.decoded.payload berisi payload JWT
  // Anda bisa melakukan pengecekan tambahan di sini, misalnya apakah user masih aktif
  // const user = await User.findByPk(artifacts.decoded.payload.id);
  // if (!user || user.deleted_at) {
  //   return { isValid: false };
  // }
  return {
    isValid: true,
    credentials: { user: artifacts.decoded.payload }, // Ini akan tersedia di request.auth.credentials
  };
};

const registerAuthStrategy = (server) => {
  server.auth.strategy('jwt_access', 'jwt', {
    keys: accessTokenSecret,
    verify: {
      aud: 'urn:audience:access',
      iss: 'urn:issuer:platform',
      sub: false, // jika Anda tidak menggunakan 'sub'
      nbf: true,
      exp: true,
    },
    validate: validateJwt,
  });

  // Set default strategy (opsional, tapi sering berguna)
  // server.auth.default('jwt_access');
};

module.exports = { registerAuthStrategy };
