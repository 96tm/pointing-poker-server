import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { Message } from '../../models/entities/message';
import { IGame } from '../../models/game';
import { IMessage } from '../../models/message';
import { DataService } from '../../services/data-service';
import { IResponseWS } from '../types';

export interface IClientPostMessageParameters extends IClientRequestParameters {
  message: IMessage;
}

export interface IAddPlayerResponseWS extends IResponseWS {
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
    }: IAddPlayerResponseWS) => void
  ) => {
    const game = (await DataService.Games.findOne({ id: gameId })) as IGame;
    const postedMessage = new Message({ userId, message });
    game.messages.addMany([postedMessage]);
    socket
      .to(gameId)
      .emit('messagePosted', { message, messageId: postedMessage.id, userId });
    acknowledge({
      statusCode: StatusCodes.OK,
      messageId: postedMessage.id,
      gameId,
    });
  };
}
