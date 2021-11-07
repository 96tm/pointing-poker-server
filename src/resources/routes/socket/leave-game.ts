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
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const player = await game.players.findOne({ id: playerId });
    if (!player) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Player not found',
      });
      return;
    }
    await game.players.deleteOne({ id: playerId });
    if (game.votingKick) {
      game.votingKick.votingPlayers = game.votingKick.votingPlayers.filter(
        (player) => player.id !== playerId
      );
    }
    socketIOServer.in(gameId).emit(SocketResponseEvents.playerLeft, {
      playerId,
      firstName: player.firstName,
      lastName: player.lastName,
    });
    socketIOServer.in(player.socketId).socketsLeave(gameId);
    acknowledge({ statusCode: StatusCodes.OK });
  };
}
