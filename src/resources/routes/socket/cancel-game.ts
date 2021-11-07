import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientCancelGameParameters extends IClientRequestParameters {
  dealerId: string;
}

export function cancelGame(socketIOServer: Server) {
  return async (
    { dealerId, gameId }: IClientCancelGameParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    await DataService.Games.deleteOne({ id: gameId });
    socketIOServer.in(gameId).emit(SocketResponseEvents.gameCancelled);
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
