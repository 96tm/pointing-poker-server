import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TCardScore } from '../../models/card';
import { TUserRole } from '../../models/user';
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
  ) => {
    console.log('start round', dealerId);

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ id: dealerId });
    console.log(
      'dealer',
      dealer,
      dealer?.role,
      TUserRole.dealer,
      dealer?.role !== TUserRole.dealer
    );

    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    const issue = await game.issues.findOne({ id: game.currentIssueId });
    if (!issue) {
      throw Error('Issue not found');
    }
    // reset issue score when round starts
    issue.lastRoundResult = {};
    issue.score = 0;
    socketIOServer.in(gameId).emit(SocketResponseEvents.issueScoreUpdated, {
      issueId: issue.id,
      roundResult: issue.lastRoundResult,
      totalScore: 0,
    });
    game.startRound(async () => {
      if (game.settings.autoFlipCardsByTimer) {
        socketIOServer.in(gameId).emit(SocketResponseEvents.roundFinished, {
          issueId: issue.id,
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
