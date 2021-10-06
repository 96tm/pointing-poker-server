import { StatusCodes } from 'http-status-codes';
import { Server, Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { IssueModel } from '../../repository/mongo/entities/issue';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IDeleteIssueResponseWS extends IResponseWS {
  gameId: string;
}

export interface IClientDeleteIssueParameters extends IClientRequestParameters {
  dealerId: string;
  deletedIssueId: string;
}

export function deleteIssue(socketIOServer: Server, socket: Socket) {
  return async (
    { deletedIssueId, gameId, dealerId }: IClientDeleteIssueParameters,
    acknowledge: ({ statusCode }: Partial<IDeleteIssueResponseWS>) => void
  ): Promise<void> => {
    console.log('delete issue');
    const game = await DataService.Games.findOne({ _id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const issue = await IssueModel.findOne({
      game: gameId,
      _id: deletedIssueId,
    });
    if (!issue) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Issue not found',
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
    await IssueModel.deleteOne({ game: gameId, _id: deletedIssueId });
    const issues = await IssueModel.find({ game: gameId });
    if (!issues.length) {
      game.currentIssueId = '';
      socketIOServer
        .in(gameId)
        .emit(SocketResponseEvents.currentIssueChanged, { issueId: '' });
    }
    socket.to(gameId).emit(SocketResponseEvents.issueDeleted, {
      deletedIssueId,
      title: issue.title,
    });
    acknowledge({
      statusCode: StatusCodes.OK,
      gameId,
    });
  };
}
