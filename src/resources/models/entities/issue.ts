import { IDocument } from './document';
import { v4 as uuid } from 'uuid';
import {
  IIssue,
  TIssuePriority,
  TIssueScoreStatistics,
  TRoundResult,
} from '../issue';
import { TCardScore } from '../card';

export class Issue implements IDocument, IIssue {
  id: string;
  title: string;
  priority: TIssuePriority;
  link: string;
  lastRoundResult: TRoundResult;
  score = 0;

  constructor({
    id,
    title,
    priority,
    link,
    lastRoundResult,
  }: PartialBy<IIssue, 'id'>) {
    this.id = id || uuid();
    this.title = title;
    this.priority = priority;
    this.link = link;
    this.lastRoundResult = lastRoundResult;
  }

  getRoundScore(): number {
    const issueScores = Object.values(this.lastRoundResult);
    const sum = issueScores.reduce((acc: number, cur) => {
      return typeof cur === 'number' ? acc + cur : acc;
    }, 0);
    return Math.trunc(sum / (issueScores.length || 1));
  }

  getRoundResultPercentages(): number[] {
    const issueScores = Object.values(this.lastRoundResult);
    const groupedVotes = issueScores.reduce(
      (acc: TIssueScoreStatistics, cur: TCardScore) => {
        const score = acc[cur];
        if (score !== undefined) {
          acc[cur] = score + 1;
        } else {
          acc[cur] = 1;
        }
        return acc;
      },
      {}
    );
    return Object.values(groupedVotes).map(
      (numberOfVotes) => ((numberOfVotes || 0) / issueScores.length) * 100
    );
  }
}
