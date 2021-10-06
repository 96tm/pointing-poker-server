import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientGetNextIssueParameters
  extends IClientRequestParameters {
  dealerId: string;
}

export function getNextIssue(socketIOServer: Server) {
  return async (
    { dealerId, gameId }: IClientGetNextIssueParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('get next issue');
    const game = await DataService.Games.findOne({ _id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const dealer = await UserModel.findOne({ game: gameId, _id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    const nextIssue = await game.getNextIssue();
    socketIOServer.in(gameId).emit(SocketResponseEvents.currentIssueChanged, {
      issueId: nextIssue?._id || '',
    });
    acknowledge({ statusCode: StatusCodes.OK });
  };
}
