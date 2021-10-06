import mongoose from 'mongoose';
import { TUserRole } from '../../../models/user';

export const UserSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
  },
  role: { type: String, enum: Object.values(TUserRole) },
  firstName: { type: String, maxlength: 20, required: true },
  lastName: { type: String, maxlength: 20 },
  jobPosition: { type: String, maxlength: 20 },
  image: { type: String },
});

export const UserModel = mongoose.model('User', UserSchema);
