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
  ) => {
    console.log('score issue', score);

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
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
    console.log('active players: ', numberOfActivePlayers);
    if (
      game.settings.canScoreAfterFlip &&
      game.status === TGameStatus.started
    ) {
      console.log('score changed after flip', issueId, roundResult, totalScore);

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
