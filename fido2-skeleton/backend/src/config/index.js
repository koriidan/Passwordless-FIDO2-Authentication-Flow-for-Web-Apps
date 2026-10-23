import dotenv from 'dotenv';
dotenv.config();

// Central config. Everything reads from here, not from process.env directly,
// so there's one place to see what the app needs.
export const config = {
  port: process.env.PORT || 3000,
  rpID: process.env.RP_ID || 'localhost',
  rpName: process.env.RP_NAME || 'CS4389 Demo',
  origin: process.env.ORIGIN || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-secret',
};
