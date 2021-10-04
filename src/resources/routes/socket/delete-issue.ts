import { StatusCodes } from 'http-status-codes';
import { Server, Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IGame } from '../../models/game';
import { TUserRole } from '../../models/user';
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
  ) => {
    console.log('delete issue');
    const game = (await DataService.Games.findOne({ id: gameId })) as IGame;
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const issue = await game.issues.findOne({ id: deletedIssueId });
    if (!issue) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Issue not found',
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
    await game.issues.deleteOne({ id: deletedIssueId });
    const issues = await game.issues.getAll();
    if (!issues.length) {
      game.currentIssueId = '';
      socketIOServer
        .in(gameId)
        .emit(SocketResponseEvents.currentIssueChanged, { issueId: '' });
    }
    socket.to(game.id).emit(SocketResponseEvents.issueDeleted, {
      deletedIssueId,
      title: issue.title,
    });
    acknowledge({
      statusCode: StatusCodes.OK,
      gameId,
    });
  };
}
