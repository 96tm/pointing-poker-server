import express from 'express';

export default function routeConnect(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (req.originalUrl === '/connect') {
    res.json({ connectionStatus: true });
    return;
  }
  next();
}
