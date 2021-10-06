import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IIssue } from '../../models/issue';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientUpdateIssueParameters extends IClientRequestParameters {
  dealerId: string;
  updatedIssue: IIssue;
}

export function updateIssue(socket: Socket) {
  return async (
    { updatedIssue, dealerId, gameId }: IClientUpdateIssueParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('update issue');

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
    await game.issues.updateMany({ id: updatedIssue.id }, updatedIssue);
    socket
      .to(game.id)
      .emit(SocketResponseEvents.issueUpdated, { updatedIssue });
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
