import { IDocument } from './document';
import { v4 as uuid } from 'uuid';
import { IUser, TUserRole } from '../user';

export class User implements IDocument, IUser {
  id: string;
  socketId: string;
  role: TUserRole;
  firstName: string;
  lastName?: string;
  jobPosition?: string;
  image?: string;

  constructor({
    id,
    socketId,
    role,
    firstName,
    lastName,
    jobPosition,
    image,
  }: PartialBy<IUser, 'id'>) {
    this.id = id || uuid();
    this.socketId = socketId;
    this.role = role;
    this.firstName = firstName;
    this.lastName = lastName;
    this.jobPosition = jobPosition;
    this.image = image;
  }
}
