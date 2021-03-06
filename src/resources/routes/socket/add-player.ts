import { StatusCodes } from 'http-status-codes';
import { Server, Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { User } from '../../models/entities/user';
import { TGameStatus } from '../../models/game';
import { IUser, TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IAddPlayerResponseWS extends IResponseWS {
  playerId: string;
}

export interface IClientAddPlayerParameters extends IClientRequestParameters {
  addedPlayer: IUser;
}

export function addPlayer(socketIOServer: Server, socket: Socket) {
  return async (
    {
      addedPlayer: { firstName, lastName, image, role, jobPosition },
      gameId,
    }: IClientAddPlayerParameters,
    acknowledge: ({
      statusCode,
      playerId,
    }: Partial<IAddPlayerResponseWS>) => void
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const player = new User({
      firstName,
      lastName,
      image,
      role,
      jobPosition,
      socketId: socket.id,
    });
    const dealer = await game.players.findOne({ role: TUserRole.dealer });
    if (!dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    socket.join(game.id);
    if (
      [TGameStatus.started, TGameStatus.roundInProgress].includes(
        game.status
      ) &&
      !game.settings.autoAdmit
    ) {
      await game.addEntryRequest(player);
      socketIOServer
        .to(dealer.socketId)
        .emit(SocketResponseEvents.entryRequested, {
          firstName,
          lastName,
          role,
          jobPosition,
        });
    } else {
      await game.players.addMany([player]);
      socket
        .to(gameId)
        .emit(SocketResponseEvents.playerAdded, { addedPlayer: player });
      const players = await game.players.getAll();
      const messages = await game.messages.getAll();
      const issues = await game.issues.getAll();
      socketIOServer.to(socket.id).emit(SocketResponseEvents.playerAdmitted, {
        playerId: player.id,
        players,
        issues,
        messages,
        gameStatus: game.status,
        currentIssueId: game.currentIssueId,
        gameId,
        gameSettings: game.settings,
      });
    }
    acknowledge({
      statusCode: StatusCodes.OK,
      playerId: player.id, //!
    });
  };
}
