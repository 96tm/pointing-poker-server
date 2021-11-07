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
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
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
    const issue = await game.issues.findOne({ id: game.currentIssueId });
    if (!issue) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Current issue not set',
      });
      return;
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
