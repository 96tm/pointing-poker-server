import {
  Users,
  Games,
  Messages,
  Issues,
} from '../repository/repository.memory';

export const DataService = {
  Users: new Users([]),
  Games: new Games([]),
  Messages: new Messages([]),
  Issues: new Issues([]),
};
