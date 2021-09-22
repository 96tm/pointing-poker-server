export enum TVotingResult {
  accept,
  decline,
  inProgress,
}

export interface IVotingKick {
  timerHandle?: ReturnType<typeof globalThis.setTimeout>;
  votingPlayerId: string;
  kickedPlayerId: string;
  init: (
    votingPlayerId: string,
    kickedPlayerId: string,
    numberOfVoters: number
  ) => void;
  reset: () => void;
  inProgress: boolean;
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
    private numberOfVoters = 0
  ) {}

  get inProgress(): boolean {
    return !!this.kickedPlayerId;
  }

  getAcceptNumber(): number {
    return this.acceptNumber;
  }

  getNumberOfVoters(): number {
    return this.numberOfVoters;
  }

  init(
    votingPlayerId: string,
    kickedPlayerId: string,
    numberOfVoters: number
  ): void {
    this.votingPlayerId = votingPlayerId;
    this.kickedPlayerId = kickedPlayerId;
    this.numberOfVoters = numberOfVoters;
  }

  reset(): void {
    this.votingPlayerId = '';
    this.kickedPlayerId = '';
    this.acceptNumber = 0;
    this.declineNumber = 0;
    this.numberOfVoters = 0;
    this.stopTimer();
  }

  checkResult(): TVotingResult {
    const majority = Math.trunc(this.numberOfVoters / 2) + 1;
    if (this.acceptNumber >= majority) {
      this.reset();
      return TVotingResult.accept;
    } else if (this.declineNumber >= majority) {
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
