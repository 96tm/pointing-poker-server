import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientFinishRoundParameters extends IClientRequestParameters {
  dealerId: string;
}

export function finishRound(socketIOServer: Server) {
  return async (
    { dealerId, gameId }: IClientFinishRoundParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('finish round');
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    const issue = await game.issues.findOne({ id: game.currentIssueId });
    if (!issue) {
      throw Error('Current issue not set');
    }
    await game.finishRound();

    socketIOServer.in(gameId).emit(SocketResponseEvents.roundFinished, {
      issueId: issue.id,
      roundResult: issue.lastRoundResult,
      totalScore: issue.score,
    });
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
