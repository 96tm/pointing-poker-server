import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { IssueModel } from '../../repository/mongo/entities/issue';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientChangeCurrentIssueParameters
  extends IClientRequestParameters {
  dealerId: string;
  issueId: string;
}

export function changeCurrentIssue(socketIOServer: Server) {
  return async (
    { issueId, dealerId, gameId }: IClientChangeCurrentIssueParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('change current issue');
    const game = await DataService.Games.findOne({ _id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const issue = await IssueModel.findOne({ game: gameId, _id: issueId });
    if (!issue) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Issue not found',
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
    game.currentIssueId = issueId;
    socketIOServer
      .in(gameId)
      .emit(SocketResponseEvents.currentIssueChanged, { issueId });
    acknowledge({ statusCode: StatusCodes.OK });
  };
}
