import { v4 as uuid } from 'uuid';
import {
  Collection,
  Issues,
  Messages,
  Users,
} from '../../repository/repository.memory';
import { TCardScore, TCardScoreSpecialValue } from '../card';
import { IGame, IScoreIssueResult, TGameStatus } from '../game';
import { GameSettings, IGameSettings } from '../game-settings';
import { IIssue } from '../issue';
import { IMessage } from '../message';
import { IUser, TUserRole } from '../user';
import { IVotingKick, VotingKick } from '../voting-kick';
import { IDocument } from './document';

type TGameParameters = Omit<IGame, 'players' | 'issues' | 'messages'> & {
  players: IUser[];
  messages: IMessage[];
  issues: IIssue[];
};

export class Game implements IDocument, IGame {
  id: string;
  currentIssueId: string;
  dealerSocketId: string;
  status: TGameStatus;
  players: Collection<IUser>;
  issues: Collection<IIssue>;
  messages: Collection<IMessage>;
  settings: IGameSettings;
  votingKick: IVotingKick = new VotingKick();
  entryRequestQueue: IUser[] = [];
  roundTimerHandle?: ReturnType<typeof globalThis.setTimeout>;

  constructor({
    id,
    dealerSocketId,
    currentIssueId,
    status,
    settings,
    players = [],
    messages = [],
    issues = [],
  }: Partial<TGameParameters> & Pick<TGameParameters, 'dealerSocketId'>) {
    this.id = id || uuid();
    this.dealerSocketId = dealerSocketId;
    this.currentIssueId = currentIssueId || '';
    this.status = status || TGameStatus.inactive;
    this.players = new Users(players);
    this.issues = new Issues(issues);
    this.messages = new Messages(messages);
    this.settings = settings || new GameSettings();
  }

  async addEntryRequest(userInfo: IUser): Promise<void> {
    this.entryRequestQueue.splice(0, 0, userInfo);
  }

  async popEntryRequest(): Promise<IUser | undefined> {
    const first = this.entryRequestQueue[0];
    this.entryRequestQueue = this.entryRequestQueue.slice(1);
    return first;
  }

  async getNextIssue(): Promise<IIssue | undefined> {
    const id = this.currentIssueId;
    const issues = await this.issues.getAll();
    const index = issues.findIndex((issue) => issue.id === id);
    const nextIssue = issues[(index + 1) % issues.length];
    if (nextIssue) {
      this.currentIssueId = nextIssue.id;
    }
    return nextIssue;
  }

  async scoreIssue(
    issueId: string,
    playerId: string,
    score: TCardScore
  ): Promise<IScoreIssueResult> {
    const issue = await this.issues.findOne({ id: issueId });
    if (!issue) {
      throw Error('No such issue');
    }
    issue.lastRoundResult[playerId] = score;
    issue.score = issue.getRoundScore();
    return {
      numberOfScores: Object.keys(issue.lastRoundResult).length,
      roundResult: issue.lastRoundResult,
      totalScore: issue.score,
    };
  }

  async scoreCurrentIssue(
    playerId: string,
    score: TCardScore
  ): Promise<IScoreIssueResult> {
    return await this.scoreIssue(this.currentIssueId, playerId, score);
  }

  async getActivePlayers(): Promise<IUser[]> {
    const players = (await this.players.getAll()).filter(
      (player) =>
        player.role === TUserRole.player ||
        (player.role === TUserRole.dealer && this.settings.canDealerPlay)
    );
    return players;
  }

  async startRound(callback: () => void): Promise<void> {
    this.status = TGameStatus.roundInProgress;
    const currentIssue = await this.issues.findOne({ id: this.currentIssueId });
    if (currentIssue) {
      currentIssue.lastRoundResult = {};
    } else {
      throw Error('Issue not found');
    }
    if (this.settings.timer) {
      const { minutes, seconds } = this.settings.timer;
      this.roundTimerHandle = globalThis.setTimeout(async () => {
        await this.finishRound();
        await callback();
      }, (minutes * 60 + seconds) * 1000);
    }
  }

  async finishRound(): Promise<void> {
    if (this.roundTimerHandle) {
      clearTimeout(this.roundTimerHandle);
    }
    this.status = TGameStatus.started;
    const currentIssue = await this.issues.findOne({ id: this.currentIssueId });
    if (!currentIssue) {
      throw Error('Current issue not set');
    }
    const activePlayers = await this.getActivePlayers();
    activePlayers.forEach((player) => {
      if (!currentIssue.lastRoundResult[player.id]) {
        currentIssue.lastRoundResult[player.id] =
          TCardScoreSpecialValue.unknown;
      }
    });
    currentIssue.score = currentIssue.getRoundScore();
  }
}
