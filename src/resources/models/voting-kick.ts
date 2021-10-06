import { IUser } from './user';

export enum TVotingResult {
  accept,
  decline,
  inProgress,
}

export interface IVotingKick {
  timerHandle?: ReturnType<typeof globalThis.setTimeout>;
  votingPlayerId: string;
  kickedPlayerId: string;
  inProgress: boolean;
  votingPlayers: IUser[];
  init: (
    votingPlayerId: string,
    kickedPlayerId: string,
    votingPlayers: IUser[]
  ) => void;
  reset: () => void;
  getAcceptNumber: () => number;
  getNumberOfVoters: () => number;
  checkResult: () => TVotingResult;
  voteFor: () => void;
  voteAgainst: () => void;
}

export class VotingKick implements IVotingKick {
  timerHandle?: ReturnType<typeof globalThis.setTimeout>;

  constructor(
    public votingPlayerId = '',
    public kickedPlayerId = '',
    private acceptNumber = 0,
    private declineNumber = 0,
    public votingPlayers: IUser[] = []
  ) {}

  get inProgress(): boolean {
    return !!this.kickedPlayerId;
  }

  getAcceptNumber(): number {
    return this.acceptNumber;
  }

  getNumberOfVoters(): number {
    return this.votingPlayers.length;
  }

  init(
    votingPlayerId: string,
    kickedPlayerId: string,
    votingPlayers: IUser[]
  ): void {
    this.votingPlayerId = votingPlayerId;
    this.kickedPlayerId = kickedPlayerId;
    this.votingPlayers = votingPlayers;
  }

  reset(): void {
    this.votingPlayerId = '';
    this.kickedPlayerId = '';
    this.acceptNumber = 0;
    this.declineNumber = 0;
    this.votingPlayers = [];
    this.stopTimer();
  }

  checkResult(): TVotingResult {
    console.log(
      'check',
      this.acceptNumber,
      Math.trunc((this.getNumberOfVoters() + 1) / 2) + 1
    );

    const majority = Math.trunc((this.getNumberOfVoters() + 1) / 2) + 1;
    if (this.acceptNumber >= majority) {
      console.log('accept');
      this.reset();
      return TVotingResult.accept;
    } else if (
      this.acceptNumber + this.declineNumber ===
      this.getNumberOfVoters()
    ) {
      console.log('decline');

      this.reset();
      return TVotingResult.decline;
    }
    return TVotingResult.inProgress;
  }

  voteFor(): void {
    this.acceptNumber += 1;
  }

  voteAgainst(): void {
    this.declineNumber += 1;
  }

  setTimer(timeout: ReturnType<typeof globalThis.setTimeout>): void {
    this.timerHandle = timeout;
  }

  stopTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
    }
  }
}
