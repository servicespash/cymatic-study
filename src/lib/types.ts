export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: "student" | "tutor" | "admin";
}

export interface UserProfile {
  id: string;
  userId: string;
  gradeLevel: string;
  subjects: string[];
  bio?: string;
}

export interface CurriculumProgress {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  completed: boolean;
  score?: number;
}

export interface StudyNote {
  id: string;
  userId: string;
  subject: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
