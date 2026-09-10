import Dexie, { Table } from "dexie";
import { NewsItem, Profile, ProjectSubmission } from "./schema";

export interface ChatSession {
  id?: number;
  messages: Array<{
    id: string;
    sender: "student" | "tutor" | "socratic_tutor";
    text: string;
    timestamp: string;
  }>;
  timestamp: number;
}

export class AppDatabase extends Dexie {
  news_broadcasts!: Table<NewsItem, string>;
  news!: Table<NewsItem, string>;
  profiles!: Table<Profile, string>;
  submissions!: Table<ProjectSubmission, string>;
  project_submissions!: Table<ProjectSubmission, string>;
  chatSessions!: Table<ChatSession, number>;

  constructor() {
    super("CymaticAppDatabase");
    this.version(1).stores({
      news_broadcasts: "id, title, category, published_at",
      profiles: "id, user_id, org_id",
      submissions: "id, student_id, school_id, org_id",
      chatSessions: "++id, timestamp",
    });
    this.version(2).stores({
      news_broadcasts: "id, title, category, published_at",
      news: "id, title, category, published_at",
      profiles: "id, user_id, org_id",
      submissions: "id, student_id, school_id, org_id",
      project_submissions: "id, student_id, school_id, org_id",
      chatSessions: "++id, timestamp",
    });
  }
}

export const db = new AppDatabase();

