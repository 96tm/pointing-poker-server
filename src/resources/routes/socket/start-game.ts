import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TGameStatus } from '../../models/game';
import { IGameSettings } from '../../models/game-settings';
import { TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientStartGameParameters extends IClientRequestParameters {
  settings: IGameSettings;
  dealerId: string;
}

export function startGame(socket: Socket) {
  return async (
    { dealerId, settings, gameId }: IClientStartGameParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('start game');
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      throw Error('Game not found');
    }
    await DataService.Games.updateMany(
      { id: gameId },
      { status: TGameStatus.started, settings: settings }
    );
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      throw Error('Dealer not found');
    }
    socket.to(gameId).emit(SocketResponseEvents.gameStarted, { settings });
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}