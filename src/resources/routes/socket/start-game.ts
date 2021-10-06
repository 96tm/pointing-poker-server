import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IGameSettings } from '../../models/game-settings';
import { TGameStatus } from '../../models/types';
import { TUserRole } from '../../models/user';
import { UserModel } from '../../repository/mongo/entities/user';
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
    console.log('start game');
    const game = await DataService.Games.findOne({ _id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    Object.assign(game, { status: TGameStatus.started, settings: settings });
    await game.save();

    const dealer = await UserModel.findOne({ game: gameId, _id: dealerId });
    if (dealer?.role !== TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    console.log('started');

    socketIOServer
      .in(gameId)
      .emit(SocketResponseEvents.gameStarted, { settings });
    acknowledge({
      statusCode: StatusCodes.OK,
    });
  };
}
