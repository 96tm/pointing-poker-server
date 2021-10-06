import { StatusCodes } from 'http-status-codes';
import { Socket } from 'socket.io';
import { MIN_NUMBER_OF_PLAYERS_TO_VOTE } from '../../../shared/config';
import { IClientRequestParameters } from '../../models/api';
import { IUser, TUserRole } from '../../models/user';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { IResponseWS, SocketResponseEvents } from '../types';

export interface IClientStartVotingToKickParameters
  extends IClientRequestParameters {
  votingPlayerId: string;
  kickedPlayerId: string;
}

export function startVotingToKick(socket: Socket) {
  return async (
    {
      votingPlayerId,
      kickedPlayerId,
      gameId,
    }: IClientStartVotingToKickParameters,
    acknowledge: ({ statusCode }: IResponseWS) => void
  ): Promise<void> => {
    console.log('start voting to kick player');

    const game = await DataService.Games.findOne({ _id: gameId });
    if (!game) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Game not found',
      });
      return;
    }
    const players = await UserModel.find({ game: gameId });
    const playerToKick = players.find(
      (player: IUser) => player._id === kickedPlayerId
    );
    if (!playerToKick) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Player not found',
      });
      return;
    } else if (playerToKick.role === TUserRole.dealer) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: `Can't kick the dealer`,
      });
      return;
    }
    const votingPlayers = players.filter((player: IUser) => {
      return player.role === TUserRole.player && player._id !== kickedPlayerId;
    });
    if (votingPlayers.length + 1 < MIN_NUMBER_OF_PLAYERS_TO_VOTE) {
      acknowledge({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Not enough players to vote',
      });
    } else if (game.votingKick.inProgress) {
      console.log('voting in progress');

      acknowledge({
        statusCode: StatusCodes.CONFLICT,
        message: 'Voting in progress, please wait until it ends and try again',
      });
    } else {
      game.votingKick.init(votingPlayerId, kickedPlayerId, votingPlayers);
      game.votingKick.voteFor();
      socket.to(gameId).emit(SocketResponseEvents.votingToKickStarted, {
        votingPlayerId,
        kickedPlayerId,
      });
      acknowledge({
        statusCode: StatusCodes.OK,
      });
    }
  };
}
