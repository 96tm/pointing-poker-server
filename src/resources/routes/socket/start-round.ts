import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TCardScore } from '../../models/card';
import { TUserRole } from '../../models/user';
import { IssueModel } from '../../repository/mongo/entities/issue';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientStartRoundParameters extends IClientRequestParameters {
  dealerId: string;
  score: TCardScore;
}

export function startRound(socketIOServer: Server) {
  return async (
    { dealerId, gameId }: IClientStartRoundParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('start round', dealerId);
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
        message: 'Issue not found',
      });
      return;
    }
    // reset issue score when round starts
    issue.lastRoundResult = {};
    issue.score = 0;
    await issue.save();
    socketIOServer.in(gameId).emit(SocketResponseEvents.issueScoreUpdated, {
      issueId: issue._id,
      roundResult: issue.lastRoundResult,
      totalScore: 0,
    });
    game.startRound(async () => {
      if (game.settings.autoFlipCardsByTimer) {
        socketIOServer.in(gameId).emit(SocketResponseEvents.roundFinished, {
          issueId: issue._id,
          roundResult: issue.lastRoundResult,
          totalScore: issue.score,
        });
      }
    });
    socketIOServer.in(gameId).emit(SocketResponseEvents.roundStarted);
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
