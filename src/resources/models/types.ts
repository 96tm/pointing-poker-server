import { TRoundResult } from './issue';

export enum TGameStatus {
  lobby = 'lobby',
  started = 'started',
  roundInProgress = 'roundInProgress',
  inactive = 'inactive',
}

export interface IScoreIssueResult {
  numberOfScores: number;
  roundResult: TRoundResult;
  totalScore: number;
}
