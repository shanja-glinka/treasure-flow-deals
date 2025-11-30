/**
 * This function exports a configuration object with environment variables for a Node.js application,
 * including app name, description, version, and database credentials.
 */
export const configuration = () => ({
  NODE_ENV: process.env.NODE_ENV,
  app: {
    port: parseInt(process.env.APP_PORT, 10) || 3000,
    name: process.env.APP_NAME,
    description: process.env.APP_DESCRIPTION,
    version: process.env.APP_VERSION,
    isProduction: Boolean(process.env.APP_IS_PRODUCTION),
  },

  db: {
    host: process.env.MONGODB_HOST,
    port: parseInt(process.env.MONGODB_PORT, 10) || 27017,
    name: process.env.MONGODB_NAME,
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
    type: 'mongodb',
    synchronize: process.env.DB_SYNCHRONIZE_ENTITIES?.toLowerCase() === 'true',
  },
});
