import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { IssueModel } from '../../repository/mongo/entities/issue';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientFinishRoundParameters extends IClientRequestParameters {
  dealerId: string;
}

export function finishRound(socketIOServer: Server) {
  return async (
    { dealerId, gameId }: IClientFinishRoundParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('finish round');
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
    const issue = await IssueModel.findOne({
      game: gameId,
      _id: game.currentIssueId,
    });
    if (!issue) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Current issue not set',
      });
      return;
    }
    await game.finishRound();

    socketIOServer.in(gameId).emit(SocketResponseEvents.roundFinished, {
      issueId: issue._id,
      roundResult: issue.lastRoundResult,
      totalScore: issue.score,
    });
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
