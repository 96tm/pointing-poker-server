import { IIssue } from './issue';
import { IMessage } from './message';
import { IUser } from './user';
import { StatusCodes } from 'http-status-codes';
import { IGameSettings } from './game-settings';

export interface IClientRequestParameters {
  gameId: string;
}

interface IResponse {
  statusCode: StatusCodes;
  message?: string;
}

export interface IConnectResponse extends IResponse {
  connectionStatus: boolean;
}

export interface ICheckGameResponse extends IResponse {
  gameExists: boolean;
}

export interface ICreateGameResponse extends IResponse {
  dealerId: string;
  gameId: string;
}

export interface IPostMessageResponse extends IResponse {
  gameId: string;
  messageId: string;
}

export interface IStartRoundResponse extends IResponse {
  gameId: string;
  issueId: string;
}

export interface IFinishGameResponse extends IResponse {
  gameId: string;
}

export interface IChangeCurrentIssueResponse extends IResponse {
  gameId: string;
  issueId: string;
}

export interface IUpdateIssueResponse extends IResponse {
  gameId: string;
  issueId: string;
}

export interface ILeaveGameResponse extends IResponse {
  gameId: string;
}

export interface IStartGameResponse extends IResponse {
  gameId: string;
}

export interface ICancelGameResponse extends IResponse {
  gameId: string;
}

export interface IKickPlayerResponse extends IResponse {
  gameId: string;
  kickedPlayerId: string;
}

export interface ICheckGameRequestParameters {
  gameId: string;
}

export interface IClientStartRoundParameters extends IClientRequestParameters {
  dealerId: string;
  issueId: string;
}

export interface IClientAddPlayerResult {
  gameId: string;
  dealer: IUser;
  player: IUser;
}

export interface IClientCreateGameResult {
  dealer: IUser;
  gameId: string;
}

export interface IClientPostMessageResult {
  postedMessage: IMessage;
}

export interface IClientCreateIssueResult {
  createdIssue: IIssue;
}

export interface IClientCreateGameParameters {
  dealerInfo: IUser;
  socketId: string;
}

export interface IClientFinishGameParameters extends IClientRequestParameters {
  dealerId: string;
}

export interface IClientFinishGameParameters extends IClientRequestParameters {
  dealerId: string;
}

export interface IClientKickPlayerVoteParameters
  extends IClientRequestParameters {
  votingPlayerId: string;
  kickedPlayerId: string;
}
