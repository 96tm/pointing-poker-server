import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = Number(process.env.PORT) || 4000;

export { PORT };
