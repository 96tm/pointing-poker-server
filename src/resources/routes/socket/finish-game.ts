import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientFinishGameParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export function finishGame(socket: Socket) {
  return async (
    { dealerId, gameId }: IClientFinishGameParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('finish game');
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    await DataService.Games.deleteOne({ id: gameId });
    socket.to(gameId).emit(SocketResponseEvents.gameFinished);
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
