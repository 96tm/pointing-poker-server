import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = Number(process.env.PORT) || 4000;
const MAX_VOTING_TIME = parseInt(process.env.MAX_VOTING_TIME || '15000');
const MIN_NUMBER_OF_PLAYERS_TO_VOTE =
  Number(process.env.MIN_NUMBER_OF_PLAYERS_TO_VOTE) || 0;

export { PORT, MIN_NUMBER_OF_PLAYERS_TO_VOTE, MAX_VOTING_TIME };
