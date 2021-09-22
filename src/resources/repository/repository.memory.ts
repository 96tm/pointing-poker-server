import { IDocument } from '../models/entities/document';
import { Game } from '../models/entities/game';
import { Issue } from '../models/entities/issue';
import { Message } from '../models/entities/message';
import { User } from '../models/entities/user';
import { v4 as uuid } from 'uuid';

type TCondition<T> = Partial<Record<keyof T, unknown>>;

export abstract class Collection<T extends IDocument> {
  collection: Record<string, T> = {};

  constructor(documents: T[]) {
    documents.forEach((document) => {
      this.collection[document.id] = document;
    });
  }

  private getKeysByCondition(condition: TCondition<T>): string[] {
    const conditionKeys = Object.keys(condition);
    return Object.keys(this.collection).filter((collectionKey) => {
      const document = this.collection[collectionKey];
      return conditionKeys.every((conditionKey) => {
        const conditionKeyTyped = conditionKey as keyof T;
        return document[conditionKeyTyped] === condition[conditionKeyTyped];
      });
    });
  }

  async getAll(): Promise<T[]> {
    return Object.values(this.collection);
  }

  async find(condition: TCondition<T>): Promise<T[]> {
    const keys = Object.keys(condition);
    return Object.values(this.collection).filter((document) =>
      keys.every((key) => {
        const keyTyped = key as keyof T;
        return document[keyTyped] === condition[keyTyped];
      })
    );
  }

  async findOne(condition: TCondition<T>): Promise<T | undefined> {
    const found = await this.find(condition);
    return found[0];
  }

  async deleteMany(condition: TCondition<T>): Promise<number> {
    const keysToDelete = this.getKeysByCondition(condition);
    keysToDelete.forEach((documentKey) => {
      delete this.collection[documentKey];
    });
    return keysToDelete.length;
  }

  async deleteOne(condition: TCondition<T>): Promise<boolean> {
    const keysToDelete = this.getKeysByCondition(condition);
    if (keysToDelete.length) {
      delete this.collection[keysToDelete[0]];
      return true;
    }
    return false;
  }

  async updateMany(
    condition: TCondition<T>,
    updatedDocument: Partial<T>
  ): Promise<number> {
    const keysToUpdate = this.getKeysByCondition(condition);
    keysToUpdate.forEach((key) => {
      Object.assign(this.collection[key], updatedDocument);
    });
    return keysToUpdate.length;
  }

  async addMany(documents: T[]): Promise<void> {
    documents.forEach((document) => {
      this.collection[uuid()] = document;
    });
  }
}

export class Users extends Collection<User> {}
export class Messages extends Collection<Message> {}
export class Issues extends Collection<Issue> {}
export class Games extends Collection<Game> {}
