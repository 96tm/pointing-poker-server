import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = Number(process.env.PORT) || 4000;
const MIN_NUMBER_OF_PLAYERS_TO_VOTE =
  Number(process.env.MIN_NUMBER_OF_PLAYERS_TO_VOTE) || 0;

export { PORT, MIN_NUMBER_OF_PLAYERS_TO_VOTE };
