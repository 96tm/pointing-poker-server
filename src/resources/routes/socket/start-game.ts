import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
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

export function startGame(socketIOServer: Server) {
  return async (
    { dealerId, settings, gameId }: IClientStartGameParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    await DataService.Games.updateMany(
      { id: gameId },
      { status: TGameStatus.started, settings: settings }
    );
    const dealer = await game.players.findOne({ id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    socketIOServer
      .in(gameId)
      .emit(SocketResponseEvents.gameStarted, { settings });
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
