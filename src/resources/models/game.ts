import { Collection } from '../repository/repository.memory';
import { TCardScore } from './card';
import { IGameSettings } from './game-settings';
import { IIssue, TRoundResult } from './issue';
import { IMessage } from './message';
import { IUser } from './user';
import { IVotingKick } from './voting-kick';

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

export interface IGame {
  id: string;
  currentIssueId: string;
  status: TGameStatus;
  players: Collection<IUser>;
  issues: Collection<IIssue>;
  messages: Collection<IMessage>;
  settings: IGameSettings;
  votingKick: IVotingKick;
  entryRequestQueue: IUser[];
  roundTimerHandle?: ReturnType<typeof globalThis.setTimeout>;
  getNextIssue(): Promise<IIssue | undefined>;
  scoreIssue(
    issueId: string,
    playerId: string,
    score: TCardScore
  ): Promise<IScoreIssueResult>;
  scoreCurrentIssue(
    playerId: string,
    score: TCardScore
  ): Promise<IScoreIssueResult>;
  startRound(callback: () => void): void;
  finishRound(): void;
  getActivePlayers(): Promise<IUser[]>;
  addEntryRequest(userInfo: IUser): Promise<void>;
  popEntryRequest(): Promise<IUser | undefined>;
}
