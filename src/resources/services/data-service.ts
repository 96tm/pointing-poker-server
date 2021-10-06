import { GameModel } from '../repository/mongo/entities/game';
import { IssueModel } from '../repository/mongo/entities/issue';
import { MessageModel } from '../repository/mongo/entities/message';
import { UserModel } from '../repository/mongo/entities/user';

export const DataService = {
  Users: UserModel,
  Games: GameModel,
  Messages: MessageModel,
  Issues: IssueModel,
};
