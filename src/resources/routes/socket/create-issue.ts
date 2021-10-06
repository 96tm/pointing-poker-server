import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IIssue } from '../../models/issue';
import { TUserRole } from '../../models/user';
import { IssueModel } from '../../repository/mongo/entities/issue';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientCreateIssueParameters extends IClientRequestParameters {
  dealerId: string;
  addedIssue: IIssue;
}

export interface ICreateIssueResponse extends IResponseWS {
  gameId: string;
  issueId: string;
}

export function createIssue(socket: Socket) {
  return async (
    { dealerId, addedIssue, gameId }: IClientCreateIssueParameters,
    acknowledge: ({
      statusCode,
      issueId,
    }: Partial<ICreateIssueResponse>) => void
  ): Promise<void> => {
    const issue = new IssueModel({ ...addedIssue });
    const game = await DataService.Games.findOne({ _id: gameId }).populate(
      'issues'
    );
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const dealer = await UserModel.findOne({ game: gameId, _id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    await issue.save();
    await game.issues.push(issue);
    await game.save();
    socket.to(gameId).emit(SocketResponseEvents.issueCreated, {
      addedIssue: { ...issue, id: issue._id },
    });
    acknowledge({
      gameId,
      issueId: issue._id,
      statusCode: StatusCodes.OK,
    });
  };
}
