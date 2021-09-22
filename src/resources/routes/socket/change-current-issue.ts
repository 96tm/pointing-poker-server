import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientChangeCurrentIssueParameters
  extends IClientRequestParameters {
  dealerId: string;
  issueId: string;
}

export function changeCurrentIssue(socketIOServer: Server) {
  return async (
    { issueId, dealerId, gameId }: IClientChangeCurrentIssueParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('change current issue');
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const issue = await game.issues.findOne({ id: issueId });
    if (!issue) {
      throw Error('Issue not found');
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    game.currentIssueId = issueId;
    socketIOServer
      .in(gameId)
      .emit(SocketResponseEvents.currentIssueChanged, { issueId });
    acknowledge({ statusCode: StatusCodes.OK });
  };
}
