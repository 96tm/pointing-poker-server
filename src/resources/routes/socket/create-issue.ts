import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { Issue } from '../../models/entities/issue';
import { IIssue } from '../../models/issue';
import { TUserRole } from '../../models/user';
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
    const games = await DataService.Games.getAll();
    console.log('create issue, game id: ', gameId, games);
    const issue = new Issue({ ...addedIssue });
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    await game.issues.addMany([issue]);
    socket
      .to(game.id)
      .emit(SocketResponseEvents.issueCreated, { addedIssue: issue });
    acknowledge({
      gameId,
      issueId: issue.id,
      statusCode: StatusCodes.OK,
    });
  };
}
