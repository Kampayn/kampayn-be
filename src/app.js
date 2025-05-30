'use strict';

require('dotenv').config();
const Hapi = require('@hapi/hapi');
const HapiJwt = require('@hapi/jwt');
const serverConfig = require('./config/server');
const allRoutes = require('./routes');
const { sequelize } = require('./db/models'); // For DB connection test
const { registerAuthStrategy } = require('./middlewares/authenticate');

const init = async () => {
  const server = Hapi.server({
    port: serverConfig.port,
    host: serverConfig.host,
    routes: {
      cors: {
        origin: ['*'], // Configure for your frontend URL in production
      },
      validate: {
        failAction: async (request, h, err) => {
          if (process.env.NODE_ENV === 'production') {
            // In production, log error and send generic message
            console.error('Validation Error:', err.message);
            throw Boom.badRequest('Invalid request payload input');
          } else {
            // In development, send detailed error
            console.error(err);
            throw err;
          }
        },
      },
    },
  });

  // Register JWT plugin
  await server.register(HapiJwt);

  // Define JWT authentication strategy
  registerAuthStrategy(server);

  // Register routes
  server.route(allRoutes);

  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Exit if DB connection fails
  }

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
