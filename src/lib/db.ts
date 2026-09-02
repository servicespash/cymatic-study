import Dexie, { Table } from "dexie";
import { NewsItem, Profile, ProjectSubmission } from "./schema";

export class AppDatabase extends Dexie {
  news_broadcasts!: Table<NewsItem, string>;
  profiles!: Table<Profile, string>;
  submissions!: Table<ProjectSubmission, string>;
  reports!: Table<Report, string>;

  constructor() {
    super("CymaticAppDatabase");
    this.version(1).stores({
      news_broadcasts: "id, title, category, published_at",
      profiles: "id, user_id, org_id",
      submissions: "id, student_id, school_id, org_id",
      reports: "id, title, category, created_at",
    });
  }
}

export const db = new AppDatabase();
