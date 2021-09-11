import express, { Router } from 'express';
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

app.use(router);

export default app;
