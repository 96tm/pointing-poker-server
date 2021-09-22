import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IGame } from '../../models/game';
import { IIssue } from '../../models/issue';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS } from '../types';

export interface IClientUpdateIssueParameters extends IClientRequestParameters {
  dealerId: string;
  updatedIssue: IIssue;
}

export function updateIssue(socket: Socket) {
  return async (
    { updatedIssue, dealerId, gameId }: IClientUpdateIssueParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('update issue');

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    await game.issues.updateMany({ id: updatedIssue.id }, updatedIssue);
    socket.to(game.id).emit('issueUpdated', { updatedIssue });
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
