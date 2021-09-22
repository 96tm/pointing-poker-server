import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientLeaveGameParameters extends IClientRequestParameters {
  playerId: string;
}

export function leaveGame(socketIOServer: Server) {
  return async (
    { playerId, gameId }: IClientLeaveGameParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const player = await game.players.findOne({ id: playerId });
    console.log('leave game', playerId);
    if (!player) {
      throw Error('Player not found');
    }
    await game.players.deleteOne({ id: playerId });
    socketIOServer.in(gameId).emit(SocketResponseEvents.playerLeft, {
      playerId,
      firstName: player.firstName,
      lastName: player.lastName,
    });
    socketIOServer.in(player.socketId).socketsLeave(gameId);
    acknowledge({ statusCode: StatusCodes.OK });
  };
}
