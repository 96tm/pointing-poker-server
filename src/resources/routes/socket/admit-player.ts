import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IAdmitPlayerResponseWS extends IResponseWS {
  playerId: string;
}

export interface IClientAdmitPlayerParameters extends IClientRequestParameters {
  playerId: string;
}

export function admitPlayer(socketIOServer: Server) {
  return async (
    { gameId }: IClientAdmitPlayerParameters,
    acknowledge: ({
      statusCode,
      playerId,
    }: Partial<IAdmitPlayerResponseWS>) => void
  ): Promise<void> => {
    console.log('admit player');

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const dealer = await game.players.findOne({ role: TUserRole.dealer });
    if (!dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    const addedPlayer = await game.popEntryRequest();
    if (!addedPlayer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Entry queue is empty',
      });
      return;
    }
    game.players.addMany([addedPlayer]);
    socketIOServer
      .in(gameId)
      .except(addedPlayer.socketId)
      .emit(SocketResponseEvents.playerAdded, { addedPlayer });
    const players = await game.players.getAll();
    const messages = await game.messages.getAll();
    const issues = await game.issues.getAll();
    socketIOServer
      .to(addedPlayer.socketId)
      .emit(SocketResponseEvents.playerAdmitted, {
        playerId: addedPlayer.id,
        players,
        issues,
        messages,
        gameStatus: game.status,
        currentIssueId: game.currentIssueId,
        gameId,
        gameSettings: game.settings,
      });
    acknowledge({
      statusCode: StatusCodes.OK,
      playerId: addedPlayer.id, //!
    });
  };
}
