require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5001,
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_last_mile_delivery_key_2026',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};
