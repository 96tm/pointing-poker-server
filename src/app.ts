import cors from 'cors';
import express, { Router } from 'express';
import { ICheckGameRequestParameters } from './resources/models/api';
import { DataService } from './resources/services/data-service';
import { UNHANDLED_ERROR_CODE } from './shared/constants';

process.on('uncaughtExceptionMonitor', () => {
  process.exit(UNHANDLED_ERROR_CODE);
});

const app = express();

const router = Router();

router.use(express.json());

router.use('/', (req, res, next) => {
  if (req.originalUrl === '/') {
    res.send('Server is running!');
    return;
  }
  next();
});
router.use('/connect', (req, res, next) => {
  if (req.originalUrl === '/connect') {
    res.json({ connectionStatus: true });
    return;
  }
  next();
});
router.use('/check-game', async (req, res, next) => {
  if (req.originalUrl === '/check-game') {
    const { gameId } = req.body as ICheckGameRequestParameters;
    const gameExists = Boolean(await DataService.Games.findOne({ id: gameId }));
    console.log('found', gameExists);
    res.json({ gameExists });
    return;
  }
  next();
});

app.use(cors());
app.use(router);

export default app;
