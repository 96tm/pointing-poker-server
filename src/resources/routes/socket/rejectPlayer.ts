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
    }: Partial<IRejectPlayerResponseWS>) => void
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const dealer = await game.players.findOne({ role: TUserRole.dealer });
    if (!dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    const rejectedPlayer = await game.popEntryRequest();
    if (!rejectedPlayer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Entry queue is empty',
      });
      return;
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
