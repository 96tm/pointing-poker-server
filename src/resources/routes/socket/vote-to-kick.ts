import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { IClientRequestParameters } from '../../models/api';
import { IUser, TUserRole } from '../../models/user';
import { TVotingResult } from '../../models/voting-kick';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientVoteToKickParameters extends IClientRequestParameters {
  kickedPlayerId: string;
  accept: string;
}

export function voteToKick(socketIOServer: Server) {
  return async (
    { kickedPlayerId, accept, gameId }: IClientVoteToKickParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('vote to kick player');
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
    const player = await UserModel.findOne({
      game: gameId,
      _id: kickedPlayerId,
    });
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
      console.log('vote ', game.votingKick);
      const votingPlayer = await UserModel.findOne({
        game: gameId,
        _id: game.votingKick.votingPlayerId,
      });
      let playerInfo: IUser | undefined;
      if (votingPlayer) {
        playerInfo = { ...votingPlayer };
      }
      const result = game.votingKick.checkResult();
      if (result === TVotingResult.accept) {
        await game.players.deleteMany({ _id: kickedPlayerId });
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
      } else if (result === TVotingResult.decline) {
        if (playerInfo) {
          socketIOServer
            .to(gameId)
            .except(player.socketId)
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
        }
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
