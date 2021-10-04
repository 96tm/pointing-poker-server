import { Server, Socket } from 'socket.io';
import { IGame } from '../../models/game';
import { IUser, TUserRole } from '../../models/user';
import { DataService } from '../../services/data-service';
import { SocketResponseEvents } from '../types';

export function handleDisconnect(socketIOServer: Server, socket: Socket) {
  return async (): Promise<void> => {
    try {
      const gameId = Array.from(socket.rooms).filter(
        (room) => room !== socket.id
      )[0];
      const game = (await DataService.Games.findOne({
        id: gameId,
      })) as IGame;
      const player = (await game.players.findOne({
        socketId: socket.id,
      })) as IUser;
      if (player.role === TUserRole.dealer) {
        await DataService.Games.deleteOne({ id: game.id });
        socketIOServer.in(game.id).emit(SocketResponseEvents.gameCancelled);
      } else {
        await game.players.deleteOne({ socketId: socket.id });
        socketIOServer.in(game.id).emit(SocketResponseEvents.playerLeft, {
          playerId: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
        });
      }
    } catch (error) {
      console.error((error as Error).message);
    }
  };
}
