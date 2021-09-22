import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IRejectPlayerResponseWS extends IResponseWS {
  gameId: string;
  firstName: string;
  lastName: string;
  role: TUserRole;
  jobPosition: string;
}

export interface IClientRejectPlayerParameters
  extends IClientRequestParameters {
  playerId: string;
}

export function rejectPlayer(socketIOServer: Server) {
  return async (
    { gameId }: IClientRejectPlayerParameters,
    acknowledge: ({
      statusCode,
      firstName,
      lastName,
      role,
      jobPosition,
    }: IRejectPlayerResponseWS) => void
  ) => {
    console.log('reject player');

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ role: TUserRole.dealer });
    if (!dealer) {
      throw Error('Dealer not found');
    }
    const rejectedPlayer = await game.popEntryRequest();
    if (!rejectedPlayer) {
      throw Error('Entry queue is empty');
    }
    socketIOServer
      .to(rejectedPlayer.socketId)
      .emit(SocketResponseEvents.playerRejected, {
        gameId,
      });
    socketIOServer.in(rejectedPlayer.socketId).socketsLeave(gameId);
    acknowledge({
      statusCode: StatusCodes.OK,
      gameId,
      firstName: rejectedPlayer.firstName,
      lastName: rejectedPlayer.lastName || '',
      role: rejectedPlayer.role || '',
      jobPosition: rejectedPlayer.jobPosition || '',
    });
  };
}
