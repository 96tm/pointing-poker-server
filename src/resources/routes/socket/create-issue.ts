import { StatusCodes } from 'http-status-codes';
import { Server, Socket } from 'socket.io';
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
    acknowledge: ({ statusCode, issueId }: ICreateIssueResponse) => void
  ) => {
    const games = await DataService.Games.getAll();
    console.log('create issue, game id: ', gameId, games);

    const issue = new Issue({ ...addedIssue });
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    await game.issues.addMany([issue]);
    const issues = await game.issues.getAll();
    console.log('issues total', issues.length);

    socket
      .to(game.id)
      .emit(SocketResponseEvents.issueCreated, { addedIssue: issue });
    acknowledge({
      gameId,
      issueId: issue.id,
      statusCode: StatusCodes.OK,
    });
    // if (issues.length === 1) {
    //   game.currentIssueId = issue.id;
    //   socketIOServer
    //     .in(gameId)
    //     .emit(SocketResponseEvents.currentIssueChanged, { issueId: issue.id });
    // }
  };
}
