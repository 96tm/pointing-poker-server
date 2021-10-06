import { Server, Socket } from 'socket.io';
import { IUser, TUserRole } from '../../models/user';
import { IGame } from '../../repository/mongo/entities/game';
import { UserModel } from '../../repository/mongo/entities/user';
import { DataService } from '../../services/data-service';
import { SocketResponseEvents } from '../types';

export function handleDisconnect(socketIOServer: Server, socket: Socket) {
  return async (): Promise<void> => {
    try {
      const gameId = Array.from(socket.rooms).filter(
        (room) => room !== socket.id
      )[0];
      const game = (await DataService.Games.findOne({
        _id: gameId,
      })) as IGame;
      const player = (await UserModel.findOne({
        game: gameId,
        socketId: socket.id,
      })) as IUser;
      if (player.role === TUserRole.dealer) {
        await DataService.Games.deleteOne({ _id: gameId });
        socketIOServer.in(gameId).emit(SocketResponseEvents.gameCancelled);
      } else {
        const disconnectedPlayer = await UserModel.findOne({
          game: gameId,
          socketId: socket.id,
        });
        await UserModel.deleteOne({ socketId: socket.id });
        if (disconnectedPlayer && game.votingKick) {
          game.votingKick.votingPlayers = game.votingKick.votingPlayers.filter(
            (player) => player._id !== disconnectedPlayer._id
          );
          socketIOServer.in(gameId).emit(SocketResponseEvents.playerLeft, {
            playerId: player._id,
            firstName: player.firstName,
            lastName: player.lastName,
          });
        }
      }
    } catch (error) {
      console.error((error as Error).message);
    }
  };
}
