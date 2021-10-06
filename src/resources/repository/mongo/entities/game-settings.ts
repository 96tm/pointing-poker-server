import mongoose from 'mongoose';
import { TCardType } from '../../../models/card';
import { IGameSettings } from '../../../models/game-settings';

export const GameSettingsSchema = new mongoose.Schema<IGameSettings>({
  timer: { type: Number },
  cardBackImage: { type: String },
  canDealerPlay: { type: Boolean },
  autoAdmit: { type: Boolean },
  autoFlipCards: { type: Boolean },
  autoFlipCardsByTimer: { type: Boolean },
  canScoreAfterFlip: { type: Boolean },
  cardType: { type: String, enum: Object.values(TCardType) },
});

export const GameSettingsModel = mongoose.model<IGameSettings>(
  'GameSettings',
  GameSettingsSchema
);
