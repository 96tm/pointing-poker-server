import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TCardScore } from '../../models/card';
import { TGameStatus } from '../../models/game';
import { TRoundResult } from '../../models/issue';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientScoreIssueParameters extends IClientRequestParameters {
  playerId: string;
  issueId: string;
  score: TCardScore;
}

export interface IScoreIssueResponse extends IResponseWS {
  gameId: string;
  issueId: string;
}

export function scoreIssue(socketIOServer: Server) {
  return async (
    { gameId, issueId, playerId, score }: IClientScoreIssueParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('score issue', score);

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const numberOfActivePlayers = await (await game.getActivePlayers()).length;
    let numberOfScores = 0;
    let totalScore = 0;
    let roundResult: TRoundResult = {};
    if (issueId) {
      ({ numberOfScores, roundResult, totalScore } = await game.scoreIssue(
        issueId,
        playerId,
        score
      ));
    } else {
      ({
        numberOfScores,
        roundResult,
        totalScore,
      } = await game.scoreCurrentIssue(playerId, score));
    }
    if (
      game.settings.canScoreAfterFlip &&
      game.status === TGameStatus.started
    ) {
      socketIOServer.in(gameId).emit(SocketResponseEvents.issueScoreUpdated, {
        issueId,
        roundResult,
        totalScore,
      });
      return;
    }
    // !
    if (
      numberOfActivePlayers === numberOfScores &&
      game.settings.autoFlipCards
    ) {
      console.log('round finished');
      await game.finishRound();
      socketIOServer.in(gameId).emit(SocketResponseEvents.roundFinished, {
        issueId,
        roundResult,
        totalScore,
      });
    }
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
