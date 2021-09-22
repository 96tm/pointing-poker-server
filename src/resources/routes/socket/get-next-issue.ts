import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientGetNextIssueParameters
  extends IClientRequestParameters {
  dealerId: string;
}

export function getNextIssue(socketIOServer: Server) {
  return async (
    { dealerId, gameId }: IClientGetNextIssueParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('get next issue');
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    const nextIssue = await game.getNextIssue();
    // if (!nextIssue) {
    //   throw Error('No issues found');
    // }
    socketIOServer.in(gameId).emit(SocketResponseEvents.currentIssueChanged, {
      issueId: nextIssue?.id || '',
    });
    acknowledge({ statusCode: StatusCodes.OK });
  };
}
