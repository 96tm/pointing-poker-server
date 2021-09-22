import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientCreateGameParameters } from '../../models/api';
import { Game } from '../../models/entities/game';
import { User } from '../../models/entities/user';
import { TGameStatus } from '../../models/game';
import { DataService } from '../../services/data-service';

interface IClientCreateGameResult {
  gameId: string;
  dealerId: string;
  statusCode: StatusCodes;
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
    }: IClientCreateGameResult) => void
  ) => {
    const dealer = new User({
      firstName,
      lastName,
      image,
      role,
      jobPosition,
      socketId: socket.id,
    });
    const game = new Game({ players: [dealer], status: TGameStatus.lobby });
    await DataService.Games.addMany([game]);
    console.log('create game', game.id);
    socket.join(game.id);
    acknowledge({
      gameId: game.id,
      dealerId: dealer.id,
      statusCode: StatusCodes.OK,
    });
  };
}
