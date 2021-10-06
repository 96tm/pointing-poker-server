import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { handleDisconnect } from './resources/routes/socket/handle-disconnect';
import app from './app';
import { PORT } from './shared/config';
import * as socketHandlers from './resources/routes/socket';
import { SocketRequestEvents } from './resources/routes/types';

const httpServer = http.createServer(app);
const socketIOServer = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

socketIOServer.on('connection', (socket) => {
  socket.on('disconnecting', handleDisconnect(socketIOServer, socket));
  socket.on(SocketRequestEvents.createGame, socketHandlers.createGame(socket));
  socket.on(
    SocketRequestEvents.scoreIssue,
    socketHandlers.scoreIssue(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.addPlayer,
    socketHandlers.addPlayer(socketIOServer, socket)
  );
  socket.on(
    SocketRequestEvents.postMessage,
    socketHandlers.postMessage(socket)
  );
  socket.on(
    SocketRequestEvents.createIssue,
    socketHandlers.createIssue(socket)
  );
  socket.on(
    SocketRequestEvents.startRound,
    socketHandlers.startRound(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.finishRound,
    socketHandlers.finishRound(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.updateIssue,
    socketHandlers.updateIssue(socket)
  );
  socket.on(
    SocketRequestEvents.getNextIssue,
    socketHandlers.getNextIssue(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.cancelGame,
    socketHandlers.cancelGame(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.finishGame,
    socketHandlers.finishGame(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.leaveGame,
    socketHandlers.leaveGame(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.startGame,
    socketHandlers.startGame(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.kickPlayer,
    socketHandlers.kickPlayer(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.startVotingToKick,
    socketHandlers.startVotingToKick(socket)
  );
  socket.on(
    SocketRequestEvents.voteToKick,
    socketHandlers.voteToKick(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.admitPlayer,
    socketHandlers.admitPlayer(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.rejectPlayer,
    socketHandlers.rejectPlayer(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.changeCurrentIssue,
    socketHandlers.changeCurrentIssue(socketIOServer)
  );
  socket.on(
    SocketRequestEvents.deleteIssue,
    socketHandlers.deleteIssue(socketIOServer, socket)
  );
});

httpServer.listen(PORT, () => {
  console.log('It works');
});
