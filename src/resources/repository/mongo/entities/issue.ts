import mongoose from 'mongoose';
import { TCardScore } from '../../../models/card';
import {
  TIssuePriority,
  TIssueScoreStatistics,
  TRoundResult,
} from '../../../models/issue';

export interface IIssue {
  _id: string;
  game: {
    type: mongoose.Schema.Types.ObjectId;
    ref: 'Category';
  };
  title: string;
  priority: TIssuePriority;
  link: string;
  lastRoundResult: TRoundResult;
  score: number;
  getRoundScore(): number;
  getRoundResultPercentages(): number[];
}

export const IssueSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
  },
  title: { type: String, maxlength: 20 },
  link: { type: String },
  score: { type: Number },
  lastRoundResult: {
    type: mongoose.Schema.Types.Mixed,
  },
  priority: { type: String, enum: Object.values(TIssuePriority) },
});

IssueSchema.methods.getRoundScore = function (this: IIssue): number {
  const issueScores = Object.values(this.lastRoundResult);
  const sum = issueScores.reduce((acc: number, cur) => {
    const curNumber = parseInt(String(cur));
    return typeof curNumber === 'number' ? acc + curNumber : acc;
  }, 0);
  return Math.trunc(sum / (issueScores.length || 1));
};

IssueSchema.methods.getRoundResultPercentages = function (
  this: IIssue
): number[] {
  const issueScores = Object.values(this.lastRoundResult).map((score) =>
    String(score)
  );
  const groupedVotes = issueScores.reduce(
    (acc: TIssueScoreStatistics, cur: string) => {
      const score = acc[cur as TCardScore];
      if (score !== undefined) {
        acc[cur as TCardScore] = score + 1;
      } else {
        acc[cur as TCardScore] = 1;
      }
      return acc;
    },
    {}
  );
  return Object.values(groupedVotes).map(
    (numberOfVotes) => ((numberOfVotes || 0) / issueScores.length) * 100
  );
};

export const IssueModel = mongoose.model('Issue', IssueSchema);
