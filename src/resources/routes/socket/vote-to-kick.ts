import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { TUserRole } from '../../models/user';
import { TVotingResult } from '../../models/voting-kick';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientVoteToKickParameters extends IClientRequestParameters {
  votingPlayerId: string;
  kickedPlayerId: string;
  accept: string;
}

export function voteToKick(socketIOServer: Server) {
  return async (
    { kickedPlayerId, accept, gameId }: IClientVoteToKickParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ) => {
    console.log('vote to kick player');
    const game = await DataService.Games.findOne({ id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const player = await game.players.findOne({ id: kickedPlayerId });
    if (!player) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Player not found',
      });
      return;
    } else if (player.role === TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: `Can't kick the dealer`,
      });
      return;
    }
    if (game.votingKick.inProgress) {
      accept ? game.votingKick.voteFor() : game.votingKick.voteAgainst();
      if (game.votingKick.checkResult() === TVotingResult.accept) {
        await game.players.deleteMany({ id: kickedPlayerId });
        socketIOServer
          .in(gameId)
          .emit(SocketResponseEvents.playerKickedByVote, {
            kickedPlayerId,
            firstName: player.firstName,
            lastName: player.lastName,
            acceptNumber: game.votingKick.getAcceptNumber(),
            numberOfPlayers: game.votingKick.getAcceptNumber(),
          });
        socketIOServer.in(player.socketId).socketsLeave(gameId);
        acknowledge({
          statusCode: StatusCodes.OK,
        });
      } else if (game.votingKick.checkResult() === TVotingResult.decline) {
        socketIOServer
          .in(gameId)
          .emit(SocketResponseEvents.playerNotKickedByVote, {
            kickedPlayerId,
            firstName: player.firstName,
            lastname: player.lastName,
            acceptNumber: game.votingKick.getAcceptNumber(),
            numberOfPlayers: game.votingKick.getAcceptNumber(),
          });
        acknowledge({
          statusCode: StatusCodes.OK,
        });
      } else {
        socketIOServer.in(gameId).emit(SocketResponseEvents.votedToKick, {
          kickedPlayerId,
          acceptNumber: game.votingKick.getAcceptNumber(),
          numberOfPlayers: game.votingKick.getAcceptNumber(),
        });
        acknowledge({
          statusCode: StatusCodes.OK,
        });
      }
    } else {
      acknowledge({
        statusCode: 400,
        message: 'No voting in progress, you can start one first',
      });
    }
  };
}
