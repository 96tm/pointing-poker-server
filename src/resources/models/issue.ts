import { TCardScore } from './card';

export type TRoundResult = Record<string, TCardScore>;

export type TIssueScoreStatistics = { [key in TCardScore]?: number };

export enum TIssuePriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
}
export interface IIssue {
  id: string;
  title: string;
  priority: TIssuePriority;
  link: string;
  lastRoundResult: TRoundResult;
  score: number;
  getRoundScore: () => number;
  getRoundResultPercentages: () => number[];
}

export interface IIssueScorePayload {
  playerId: string;
  issueId: string;
  score: TCardScore;
}

export interface IIssueUpdatePayload {
  issueId: string;
  issue: Partial<IIssue>;
}
