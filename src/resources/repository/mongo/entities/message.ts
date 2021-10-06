import mongoose from 'mongoose';

export interface IMessage {
  _id: string;
  userId: string;
  message: string;
}

export const MessageSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
  },
  userId: { type: String },
  message: { type: String },
});

export const MessageModel = mongoose.model('Message', MessageSchema);
