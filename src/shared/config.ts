import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_CONNECTION_STRING = String(process.env['MONGO_CONNECTION_STRING']);
const IMAGE_URL_PREFIX = 'https://res.cloudinary.com/rsschool/image/upload/';
const PORT = Number(process.env.PORT) || 4000;
const MAX_VOTING_TIME = parseInt(process.env.MAX_VOTING_TIME || '15000');
const MIN_NUMBER_OF_PLAYERS_TO_VOTE =
  Number(process.env.MIN_NUMBER_OF_PLAYERS_TO_VOTE) || 0;
const CLOUD_NAME = process.env['CLOUD_NAME'];
const API_KEY = process.env['API_KEY'];
const API_SECRET = process.env['API_SECRET'];

(async function runDb(): Promise<void> {
  try {
    await mongoose.connect(MONGO_CONNECTION_STRING);
  } catch (err) {
    console.error('Connection error', err);
  }
})();

export {
  PORT,
  MIN_NUMBER_OF_PLAYERS_TO_VOTE,
  MAX_VOTING_TIME,
  MONGO_CONNECTION_STRING,
  IMAGE_URL_PREFIX,
  CLOUD_NAME,
  API_KEY,
  API_SECRET,
};
