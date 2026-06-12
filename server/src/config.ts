/**
 * Server configuration.
 */
export const config = {
  port: parseInt(process.env.PORT || '5173', 10),
  host: process.env.HOST || '127.0.0.1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
