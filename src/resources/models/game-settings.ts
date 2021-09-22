import { TCardType } from './card';

export interface ITimer {
  minutes: number;
  seconds: number;
}

export interface IGameSettings {
  timer?: ITimer;
  cardBackImage?: string;
  canDealerPlay: boolean;
  autoAdmit: boolean;
  autoFlipCards: boolean;
  autoFlipCardsByTimer: boolean;
  canScoreAfterFlip: boolean;
  cardType: TCardType;
}

export class GameSettings {
  timer?: ITimer;
  cardBackImage?: string;
  canDealerPlay = true;
  autoAdmit = true;
  autoFlipCards = true;
  autoFlipCardsByTimer = false;
  canScoreAfterFlip = false;
  cardType = TCardType.fib;

  constructor(settings?: Partial<IGameSettings>) {
    Object.assign(this, settings);
  }
}
