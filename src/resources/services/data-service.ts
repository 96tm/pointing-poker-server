import { User } from '../models/entities/user';
import { TUserRole } from '../models/user';
import {
  Users,
  Games,
  Messages,
  Issues,
} from '../repository/repository.memory';

export const DataService = {
  Users: new Users([
    new User({
      id: 'mock',
      socketId: 'mocksid',
      firstName: 'first',
      role: TUserRole.observer,
    }),
  ]),
  Games: new Games([]),
  Messages: new Messages([]),
  Issues: new Issues([]),
};
