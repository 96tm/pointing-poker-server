export enum TUserRole {
  dealer = 'dealer',
  player = 'player',
  observer = 'observer',
}

export interface IUser {
  id: string;
  socketId: string;
  role: TUserRole;
  firstName: string;
  lastName?: string;
  jobPosition?: string;
  image?: string;
}
