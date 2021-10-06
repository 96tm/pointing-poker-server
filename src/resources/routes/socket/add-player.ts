import { StatusCodes } from 'http-status-codes';
import { Server, Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TGameStatus } from '../../models/types';
import { IUser, TUserRole } from '../../models/user';
import { GameModel } from '../../repository/mongo/entities/game';
import { IIssue, IssueModel } from '../../repository/mongo/entities/issue';
import {
  IMessage,
  MessageModel,
} from '../../repository/mongo/entities/message';
import { UserModel } from '../../repository/mongo/entities/user';
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
    const game = await GameModel.findOne({ _id: gameId }).populate('players');
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const player = new UserModel({
      firstName,
      lastName,
      image,
      role,
      jobPosition,
      socketId: socket.id,
    });
    const dealer = await UserModel.findOne({
      game: gameId,
      role: TUserRole.dealer,
    });
    if (!dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Dealer not found',
      });
      return;
    }
    socket.join(game._id);
    if (
      [TGameStatus.started, TGameStatus.roundInProgress].includes(
        game.status
      ) &&
      !game.settings.autoAdmit
    ) {
      await game.addEntryRequest({ ...player, id: player._id });
      socketIOServer
        .to(dealer.socketId)
        .emit(SocketResponseEvents.entryRequested, {
          firstName,
          lastName,
          role,
          jobPosition,
        });
    } else {
      await player.save();
      await game.players.push(player);
      await game.save();
      socket.to(gameId).emit(SocketResponseEvents.playerAdded, {
        addedPlayer: { ...player, id: player._id },
      });
      const players = ((await UserModel.find({
        game: game._id,
      })) as IUser[]).map((player) => ({ ...player, id: player._id }));
      const messages = ((await MessageModel.find({
        game: game._id,
      })) as IMessage[]).map((message) => ({ ...message, id: message._id }));
      const issues = ((await IssueModel.find({
        game: game._id,
      })) as IIssue[]).map((issue) => ({ ...issue, id: issue._id }));
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
