import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { addPlayer } from './resources/routes/socket/add-player';
import { admitPlayer } from './resources/routes/socket/admit-player';
import { cancelGame } from './resources/routes/socket/cancel-game';
import { changeCurrentIssue } from './resources/routes/socket/change-current-issue';
import { createGame } from './resources/routes/socket/create-game';
import { createIssue } from './resources/routes/socket/create-issue';
import { deleteIssue } from './resources/routes/socket/delete-issue';
import { finishGame } from './resources/routes/socket/finish-game';
import { finishRound } from './resources/routes/socket/finish-round';
import { getNextIssue } from './resources/routes/socket/get-next-issue';
import { handleDisconnect } from './resources/routes/socket/handle-disconnect';
import { kickPlayer } from './resources/routes/socket/kick-player';
import { leaveGame } from './resources/routes/socket/leave-game';
import { postMessage } from './resources/routes/socket/post-message';
import { rejectPlayer } from './resources/routes/socket/rejectPlayer';
import { scoreIssue } from './resources/routes/socket/score-issue';
import { startGame } from './resources/routes/socket/start-game';
import { startRound } from './resources/routes/socket/start-round';
import { startVotingToKick } from './resources/routes/socket/start-voting-to-kick';
import { updateIssue } from './resources/routes/socket/update-issue';
import { voteToKick } from './resources/routes/socket/vote-to-kick';
import { SocketRequestEvents } from './resources/routes/types';
import { PORT } from './shared/config';

const httpServer = http.createServer(app);
const socketIOServer = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

socketIOServer.on('connection', (socket) => {
  socket.on('disconnecting', handleDisconnect(socketIOServer, socket));
  socket.on(SocketRequestEvents.createGame, createGame(socket));
  socket.on(SocketRequestEvents.scoreIssue, scoreIssue(socketIOServer));
  socket.on(SocketRequestEvents.addPlayer, addPlayer(socketIOServer, socket));
  socket.on(SocketRequestEvents.postMessage, postMessage(socket));
  socket.on(SocketRequestEvents.createIssue, createIssue(socket));
  socket.on(
    SocketRequestEvents.deleteIssue,
    deleteIssue(socketIOServer, socket)
  );
  socket.on(SocketRequestEvents.startRound, startRound(socketIOServer));
  socket.on(SocketRequestEvents.finishRound, finishRound(socketIOServer));
  socket.on(SocketRequestEvents.updateIssue, updateIssue(socket));
  socket.on(
    SocketRequestEvents.changeCurrentIssue,
    changeCurrentIssue(socketIOServer)
  );
  socket.on(SocketRequestEvents.getNextIssue, getNextIssue(socketIOServer));
  socket.on(SocketRequestEvents.cancelGame, cancelGame(socket));
  socket.on(SocketRequestEvents.finishGame, finishGame(socket));
  socket.on(SocketRequestEvents.leaveGame, leaveGame(socketIOServer));
  socket.on(SocketRequestEvents.startGame, startGame(socket));
  socket.on(SocketRequestEvents.kickPlayer, kickPlayer(socketIOServer));
  socket.on(SocketRequestEvents.startVotingToKick, startVotingToKick(socket));
  socket.on(SocketRequestEvents.voteToKick, voteToKick(socketIOServer));
  socket.on(SocketRequestEvents.admitPlayer, admitPlayer(socketIOServer));
  socket.on(SocketRequestEvents.rejectPlayer, rejectPlayer(socketIOServer));
});

httpServer.listen(PORT, () => {
  console.log('It works');
});
