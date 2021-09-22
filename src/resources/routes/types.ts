import { StatusCodes } from 'http-status-codes';

export interface IResponseWS {
  statusCode: StatusCodes;
  message?: string;
}

export enum SocketResponseEvents {
  roundFinished = 'roundFinished',
  roundStarted = 'roundStarted',
  gameFinished = 'gameFinished',
  playerAdded = 'playerAdded',
  issueCreated = 'issueCreated',
  currentIssueChanged = 'currentIssueChanged',
  issueDeleted = 'issueDeleted',
  issueUpdated = 'issueUpdated',
  gameCancelled = 'gameCancelled',
  gameStarted = 'gameStarted',
  playerKicked = 'playerKicked',
  playerKickedByVote = 'playerKickedByVote',
  playerNotKickedByVote = 'playerNotKickedByVote',
  votingToKickStarted = 'votingToKickStarted',
  votedToKick = 'votedToKick',
  entryRequested = 'entryRequested',
  playerAdmitted = 'playerAdmitted',
  playerRejected = 'playerRejected',
  playerLeft = 'playerLeft',
  issueScoreUpdated = 'issueScoreUpdated',
}

export enum SocketRequestEvents {
  startRound = 'startRound',
  createGame = 'createGame',
  cancelGame = 'cancelGame',
  createIssue = 'createIssue',
  updateIssue = 'updateIssue',
  changeCurrentIssue = 'changeCurrentIssue',
  finishRound = 'finishRound',
  finishGame = 'finishGame',
  scoreIssue = 'scoreIssue',
  addPlayer = 'addPlayer',
  startGame = 'startGame',
  leaveGame = 'leaveGame',
  deleteIssue = 'deleteIssue',
  postMessage = 'postMessage',
  getNextIssue = 'getNextIssue',
  kickPlayer = 'kickPlayer',
  startVotingToKick = 'startVotingToKick',
  voteToKick = 'voteToKick',
  admitPlayer = 'admitPlayer',
  rejectPlayer = 'rejectPlayer',
}
