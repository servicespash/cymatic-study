export interface Organization {
  id: string;
  name: string;
  org_code: string;
}

export interface Stats {
  totalStudents: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  s5: number;
  s6: number;
  pendingSubmissions: number;
  activeTeachers: number;
}

export interface VelocityData {
  name: string;
  value: number;
}

export interface TeacherBottleneck {
  teacher_name: string;
  pending_count: number;
}
