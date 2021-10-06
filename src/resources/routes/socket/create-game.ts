import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientCreateGameParameters } from '../../models/api';
import { TGameStatus } from '../../models/types';
import { GameModel } from '../../repository/mongo/entities/game';
import { UserModel } from '../../repository/mongo/entities/user';
import { IResponseWS } from '../types';

interface IClientCreateGameResult extends IResponseWS {
  gameId: string;
  dealerId: string;
}
// !add validation

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
    const dealer = new UserModel({
      firstName,
      lastName,
      image,
      role,
      jobPosition,
      socketId: socket.id,
    });
    const game = new GameModel({
      players: [dealer],
      status: TGameStatus.lobby,
      dealerSocketId: socket.id,
    });
    await game.save();
    console.log('create game', game._id);
    socket.join(game._id);

    acknowledge({
      gameId: game._id,
      dealerId: dealer._id,
      statusCode: StatusCodes.OK,
    });
  };
}
