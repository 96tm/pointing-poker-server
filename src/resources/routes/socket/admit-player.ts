import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IIssue } from '../../models/issue';
import { IMessage } from '../../models/message';
import { IUser, TUserRole } from '../../models/user';
import { IssueModel } from '../../repository/mongo/entities/issue';
import { MessageModel } from '../../repository/mongo/entities/message';
import { UserModel } from '../../repository/mongo/entities/user';
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
    const game = await DataService.Games.findOne({ _id: gameId }).populate(
      'players'
    );
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
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
    const addedPlayer = await game.popEntryRequest();
    if (!addedPlayer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Entry queue is empty',
      });
      return;
    }
    const addedUserModel = new UserModel(addedPlayer);
    await addedUserModel.save();
    await game.players.push(addedUserModel);
    await game.save();
    socketIOServer
      .in(gameId)
      .except(addedPlayer.socketId)
      .emit(SocketResponseEvents.playerAdded, {
        ...addedPlayer,
        id: addedPlayer._id,
      });
    const players = ((await UserModel.find({
      game: gameId,
    })) as IUser[]).map((player) => ({ ...player, id: player._id }));
    const messages = ((await MessageModel.find({
      game: gameId,
    })) as IMessage[]).map((message) => ({ ...message, id: message._id }));
    const issues = ((await IssueModel.find({
      game: gameId,
    })) as IIssue[]).map((issue) => ({ ...issue, id: issue._id }));
    socketIOServer
      .to(addedPlayer.socketId)
      .emit(SocketResponseEvents.playerAdmitted, {
        playerId: addedPlayer._id,
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
