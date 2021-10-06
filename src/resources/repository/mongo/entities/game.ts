import mongoose from 'mongoose';
import {
  TCardScore,
  TCardScoreSpecialValue,
  TCardType,
} from '../../../models/card';
import { IGameSettings } from '../../../models/game-settings';
import { IMessage } from '../../../models/message';
import { TGameStatus, IScoreIssueResult } from '../../../models/types';
import { IUser, TUserRole } from '../../../models/user';
import { IVotingKick } from '../../../models/voting-kick';
import { IIssue, IssueModel } from './issue';
import { UserModel, UserSchema } from './user';

export interface IGame {
  _id: string;
  currentIssueId: string;
  dealerSocketId: string;
  status: TGameStatus;
  players: IUser;
  issues: IIssue;
  messages: IMessage;
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

export const GameSchema = new mongoose.Schema({
  id: { type: String },
  currentIssueId: { type: String },
  dealerSocketId: { type: String },
  status: { type: String, enum: Object.values(TGameStatus) },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  issues: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
    },
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  ],
  settings: {
    timer: { type: Number },
    cardBackImage: String,
    canDealerPlay: Boolean,
    autoAdmit: Boolean,
    autoFlipCards: Boolean,
    autoFlipCardsByTimer: Boolean,
    canScoreAfterFlip: Boolean,
    cardType: { type: String, enum: Object.values(TCardType) },
  },
  votingKick: {
    votingPlayerId: String,
    kickedPlayerId: String,
    inProgress: Boolean,
    votingPlayers: [UserSchema],
  },
  entryRequestQueue: [UserSchema],
  roundTimerHandle: Number,
});

GameSchema.methods.addEntryRequest = async function (
  this: IGame,
  userInfo: IUser
): Promise<void> {
  this.entryRequestQueue.splice(0, 0, userInfo);
};

GameSchema.methods.popEntryRequest = async function (
  this: IGame
): Promise<IUser | undefined> {
  const first = this.entryRequestQueue[0];
  this.entryRequestQueue = this.entryRequestQueue.slice(1);
  return first;
};

GameSchema.methods.getNextIssue = async function (
  this: IGame
): Promise<IIssue | undefined> {
  const id = this.currentIssueId;
  const issues = await IssueModel.find({ game: this._id });
  const index = issues.findIndex((issue) => issue._id === id);
  const nextIssue = issues[(index + 1) % issues.length];
  if (nextIssue) {
    this.currentIssueId = nextIssue._id;
    return nextIssue;
  }
  return undefined;
};

GameSchema.methods.scoreIssue = async function (
  this: IGame,
  issueId: string,
  playerId: string,
  score: TCardScore
): Promise<IScoreIssueResult> {
  const issue = await IssueModel.findOne({ game: this._id, _id: issueId });
  if (!issue) {
    throw Error('No such issue');
  }
  issue.lastRoundResult[playerId] = score;
  issue.score = issue.getRoundScore();
  await issue.save();
  return {
    numberOfScores: Object.keys(issue.lastRoundResult).length,
    roundResult: issue.lastRoundResult,
    totalScore: issue.score,
  };
};

GameSchema.methods.scoreCurrentIssue = async function (
  this: IGame,
  playerId: string,
  score: TCardScore
): Promise<IScoreIssueResult> {
  return await this.scoreIssue(this.currentIssueId, playerId, score);
};

GameSchema.methods.getActivePlayers = async function (
  this: IGame
): Promise<IUser[]> {
  const players = (await UserModel.find({ game: this._id })).filter(
    (player: IUser) =>
      player.role === TUserRole.player ||
      (player.role === TUserRole.dealer && this.settings.canDealerPlay)
  );
  return players;
};

GameSchema.methods.startRound = async function (
  this: any,
  callback: () => void
): Promise<void> {
  this.status = TGameStatus.roundInProgress;
  const currentIssue = await IssueModel.findOne({
    game: this._id,
    _id: this.currentIssueId,
  });
  if (currentIssue) {
    currentIssue.lastRoundResult = {};
    await currentIssue.save();
  } else {
    throw Error('Issue not found');
  }
  if (this.settings.timer) {
    const { minutes, seconds } = this.settings.timer;
    this.roundTimerHandle = globalThis.setTimeout(async () => {
      await this.finishRound();
      await callback();
    }, (minutes * 60 + seconds) * 1000);
    await this.save();
  }
};

GameSchema.methods.finishRound = async function (this: IGame): Promise<void> {
  if (this.roundTimerHandle) {
    clearTimeout(this.roundTimerHandle);
  }
  this.status = TGameStatus.started;
  const currentIssue = await IssueModel.findOne({
    game: this._id,
    _id: this.currentIssueId,
  });
  if (!currentIssue) {
    throw Error('Current issue not set');
  }
  const activePlayers = await this.getActivePlayers();
  for (let i = 0; i < activePlayers.length; i++) {
    const player = activePlayers[i];
    if (!currentIssue.lastRoundResult[player._id]) {
      currentIssue.lastRoundResult[player._id] = TCardScoreSpecialValue.unknown;
      await currentIssue.save();
    }
  }
  currentIssue.score = currentIssue.getRoundScore();
  await currentIssue.save();
};

export const GameModel = mongoose.model('Game', GameSchema);
