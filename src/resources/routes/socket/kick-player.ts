import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
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
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const player = await game.players.findOne({ id: kickedPlayerId });
    if (!player) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Player not found',
      });
      return;
    } else if (player.role === TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: `Can't kick the dealer`,
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
    game.players.deleteOne({ id: kickedPlayerId });
    if (game.votingKick) {
      game.votingKick.votingPlayers = game.votingKick.votingPlayers.filter(
        (player) => player.id !== kickedPlayerId
      );
    }
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
