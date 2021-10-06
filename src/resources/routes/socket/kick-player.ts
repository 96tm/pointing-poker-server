import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IUser, TUserRole } from '../../models/user';
import { UserModel } from '../../repository/mongo/entities/user';
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
    console.log('kick player');
    const game = await DataService.Games.findOne({ _id: gameId }).populate(
      'players'
    );
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const player = await UserModel.findOne({ _id: kickedPlayerId });
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
    const dealer = await UserModel.findOne({ _id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    UserModel.deleteOne({ game: gameId, _id: kickedPlayerId });
    game.players = (game.players as IUser[]).filter(
      (player) => player._id !== kickedPlayerId
    );
    if (game.votingKick) {
      game.votingKick.votingPlayers = game.votingKick.votingPlayers.filter(
        (player: IUser) => player._id !== kickedPlayerId
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
