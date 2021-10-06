import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IUser } from '../../models/user';
import { UserModel } from '../../repository/mongo/entities/user';
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
    const game = await DataService.Games.findOne({ _id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const player = await UserModel.findOne({ game: gameId, _id: playerId });
    console.log('leave game', playerId);
    if (!player) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Player not found',
      });
      return;
    }
    await UserModel.deleteOne({ game: gameId, _id: playerId });
    if (game.votingKick) {
      game.votingKick.votingPlayers = game.votingKick.votingPlayers.filter(
        (player: IUser) => player._id !== playerId
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
