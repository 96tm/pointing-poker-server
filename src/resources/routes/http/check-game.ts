import express from 'express';
import { ICheckGameRequestParameters } from '../../models/api';
import { DataService } from '../../services/data-service';

export default async function routeCheckGame(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  if (req.originalUrl === '/check-game') {
    const { gameId } = req.body as ICheckGameRequestParameters;
    const gameExists = Boolean(await DataService.Games.findOne({ id: gameId }));
    res.json({ gameExists });
    return;
  }
  next();
}
