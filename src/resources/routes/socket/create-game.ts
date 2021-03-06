import { StatusCodes } from 'http-status-codes';

import { Socket } from 'socket.io';
import { IClientCreateGameParameters } from '../../models/api';
import { Game } from '../../models/entities/game';
import { User } from '../../models/entities/user';
import { TGameStatus } from '../../models/game';
import { DataService } from '../../services/data-service';
import { IResponseWS } from '../types';

interface IClientCreateGameResult extends IResponseWS {
  gameId: string;
  dealerId: string;
}

export function createGame(socket: Socket) {
  return async (
    {
      dealerInfo: { firstName, lastName, image, role, jobPosition },
    }: IClientCreateGameParameters,
    acknowledge: ({
      gameId,
      dealerId,
      statusCode,
    }: Partial<IClientCreateGameResult>) => void
  ): Promise<void> => {
    const dealer = new User({
      firstName,
      lastName,
      image,
      role,
      jobPosition,
      socketId: socket.id,
    });

    const game = new Game({
      players: [dealer],
      status: TGameStatus.lobby,
      dealerSocketId: socket.id,
    });
    await DataService.Games.addMany([game]);
    socket.join(game.id);

    acknowledge({
      gameId: game.id,
      dealerId: dealer.id,
      statusCode: StatusCodes.OK,
    });
  };
}
