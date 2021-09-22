import { StatusCodes } from 'http-status-codes';
import { Server, Socket } from 'socket.io';
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
    acknowledge: ({ statusCode, playerId }: IAdmitPlayerResponseWS) => void
  ) => {
    console.log('admit player');

    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    const dealer = await game.players.findOne({ role: TUserRole.dealer });
    if (!dealer) {
      throw Error('Dealer not found');
    }
    const addedPlayer = await game.popEntryRequest();
    if (!addedPlayer) {
      throw Error('Entry queue is empty');
    }
    game.players.addMany([addedPlayer]);
    socketIOServer
      .in(gameId)
      .except(addedPlayer.socketId)
      .emit(SocketResponseEvents.playerAdded, { addedPlayer });
    const players = await game.players.getAll();
    const messages = await game.messages.getAll();
    const issues = await game.issues.getAll();
    console.log('sending', addedPlayer.socketId, game.settings);

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
