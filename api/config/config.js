/* export default {
    geminiApiKey: process.env.GOOGLE_API_KEY,
    playhtApiKey: process.env.PLAYHT_API_KEY,
    playhtUserId: process.env.PLAYHT_USER_ID,
    jwtSecret: process.env.JWT_SECRET,
  };
   */

import dotenv from 'dotenv';
dotenv.config();

const config = {
  geminiApiKey: process.env.GOOGLE_API_KEY,
  playhtApiKey: process.env.PLAYHT_API_KEY,
  playhtUserId: process.env.PLAYHT_USER_ID,
  jwtSecret: process.env.JWT_SECRET,
};

export default config;
