import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IMessage } from '../../models/message';
import { MessageModel } from '../../repository/mongo/entities/message';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS } from '../types';

export interface IClientPostMessageParameters extends IClientRequestParameters {
  message: IMessage;
}

export interface IPostMessageResponseWS extends IResponseWS {
  messageId: string;
  gameId: string;
}

export function postMessage(socket: Socket) {
  return async (
    { message: { userId, message }, gameId }: IClientPostMessageParameters,
    acknowledge: ({
      statusCode,
      messageId,
      gameId,
    }: Partial<IPostMessageResponseWS>) => void
  ): Promise<void> => {
    const game = await DataService.Games.findOne({ _id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
        gameId,
      });
      return;
    }
    const player = UserModel.findOne({ game: gameId, _id: gameId });
    if (!player) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Player not found',
        gameId,
      });
      return;
    }
    const postedMessage = new MessageModel({ userId, message });
    await postedMessage.save();
    game.messages.push(postedMessage);
    await game.save();
    socket
      .to(gameId)
      .emit('messagePosted', { message, messageId: postedMessage._id, userId });
    acknowledge({
      statusCode: StatusCodes.OK,
      messageId: postedMessage._id,
      gameId,
    });
  };
}
