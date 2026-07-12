import Dexie, { Table } from "dexie";

export interface ChatSession {
  id?: number;
  messages: any[];
  timestamp: number;
}

export class MyDatabase extends Dexie {
  chatSessions!: Table<ChatSession>;

  constructor() {
    super("CymaticDatabase");
    this.version(1).stores({
      chatSessions: "++id, timestamp",
    });
  }
}

export const db = new MyDatabase();
