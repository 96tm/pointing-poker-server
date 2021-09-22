import { StatusCodes } from 'http-status-codes';
import { Server, Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientKickPlayerParameters extends IClientRequestParameters {
  dealerId: string;
  kickedPlayerId: string;
}

export function kickPlayer(socketIOServer: Server) {
  return async (
    { dealerId, kickedPlayerId, gameId }: IClientKickPlayerParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('kick player');

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const player = await game.players.findOne({ id: kickedPlayerId });
    if (!player) {
      throw Error('Player not found');
    } else if (player.role === TUserRole.dealer) {
      throw Error(`Can't kick the dealer`);
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    game.players.deleteOne({ id: kickedPlayerId });
    socketIOServer.in(gameId).emit(SocketResponseEvents.playerKicked, {
      kickedPlayerId,
      firstName: player.firstName,
      lastName: player.lastName,
    });
    socketIOServer.in(player.socketId).socketsLeave(gameId);
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
