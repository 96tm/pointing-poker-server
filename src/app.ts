import cors from 'cors';
import express, { Router } from 'express';
import routeCheckGame from './resources/routes/http/check-game';
import routeConnect from './resources/routes/http/connect';
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
router.use('/connect', routeConnect);
router.use('/check-game', routeCheckGame);

app.use(cors());
app.use(router);

export default app;
