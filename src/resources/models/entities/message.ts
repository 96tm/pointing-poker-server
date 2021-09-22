import { IDocument } from './document';
import { v4 as uuid } from 'uuid';
import { IMessage } from '../message';

export class Message implements IDocument, IMessage {
  id: string;
  userId: string;
  message: string;

  constructor({ id, userId, message }: PartialBy<IMessage, 'id'>) {
    this.id = id || uuid();
    this.userId = userId;
    this.message = message;
  }
}
