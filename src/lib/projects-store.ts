import { useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { supabase } from "@/integrations/supabase/client";

export type BudgetItem = {
  id: string;
  name: string;
  source: "Local/Recycled" | "Purchased New";
  cost: number;
};
export type WeekLog = {
  id: string;
  week: string;
  activity: string;
  challenges: string;
  skills: string[];
};

export type TeacherMark = {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "E";
  comment: string;
  teacherName?: string;
  teacherTitle?: string;
  teacherLicenseId?: string;
  schoolReferenceKey?: string;
  markedAt: string;
  token: string;
};

export type Project = {
  id: string;
  title: string;
  subject: string;
  studentName: string;
  className: string;
  schoolName: string;
  unebIndex: string;
  status: "draft" | "pending" | "verified";
  // phases
  justification: string;
  budget: BudgetItem[];
  logs: WeekLog[];
  grade1: string;
  grade2: string;
  uniqueness: string;
  input: string;
  output: string;
  grade3: string;
  summary: string;
  grade4: string;
  xp: number;
  rewardsClaimed: Record<string, boolean>;
  // teacher
  teacherMark?: TeacherMark;
  markingToken?: string;
  markingSubmissionId?: string;
  // sync
  submissionId?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = "cymatic.projects.v2";

function read(): Project[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: Project[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Write failed", err);
  }
}

export function emptyProject(): Project {
  const now = new Date().toISOString();
  return {
    id: nanoid(10),
    title: "",
    subject: "",
    studentName: "",
    className: "",
    schoolName: "",
    unebIndex: "",
    status: "draft",
    justification: "",
    budget: [],
    logs: [],
    grade1: "",
    grade2: "",
    uniqueness: "",
    input: "",
    output: "",
    grade3: "",
    summary: "",
    grade4: "",
    xp: 0,
    rewardsClaimed: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function useProjects() {
  const [list, setList] = useState<Project[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setList(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setList(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Project[]) => {
    setList(next);
    write(next);
  }, []);

  const create = useCallback(
    (partial?: Partial<Project>) => {
      const p = { ...emptyProject(), ...partial };
      const next = [p, ...read()];
      persist(next);
      return p;
    },
    [persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<Project>) => {
      const next = read().map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      );
      persist(next);
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(read().filter((p) => p.id !== id));
    },
    [persist],
  );

  const upsert = useCallback(
    (p: Project) => {
      const cur = read();
      const idx = cur.findIndex((x) => x.id === p.id);
      const next = idx === -1 ? [p, ...cur] : cur.map((x) => (x.id === p.id ? p : x));
      persist(next);
    },
    [persist],
  );

  const getById = useCallback((id: string) => read().find((p) => p.id === id), []);

  return { list, ready, create, update, remove, upsert, getById };
}

export function scoreToGrade(score: number): TeacherMark["grade"] {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

export function gradeLabel(g: TeacherMark["grade"]) {
  return (
    {
      A: "Exceptional",
      B: "Outstanding",
      C: "Satisfactory",
      D: "Basic",
      E: "Elementary",
    } as const
  )[g];
}

// Hook for subscribing to real-time teacher marking updates
export function useProjectSubmissionSync(userId: string | undefined) {
  const { list, upsert } = useProjects();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to submission updates
    const channel = supabase
      .channel(`project_submissions_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "project_submissions",
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as any;

          // Find the local project and update it
          if (updated.project_data?.id) {
            const localProject = list.find((p) => p.id === updated.project_data.id);
            if (localProject) {
              // Build teacher mark from submission data
              const teacherMark: TeacherMark | undefined =
                updated.status === "verified"
                  ? {
                      score:
                        (Number(updated.phase1_score || 0) +
                          Number(updated.phase2_score || 0) +
                          Number(updated.phase3_score || 0) +
                          Number(updated.phase4_score || 0)) *
                        10,
                      grade: scoreToGrade(
                        (Number(updated.phase1_score || 0) +
                          Number(updated.phase2_score || 0) +
                          Number(updated.phase3_score || 0) +
                          Number(updated.phase4_score || 0)) *
                          10,
                      ),
                      comment: updated.teacher_comments || "",
                      teacherName: updated.teacher_name,
                      teacherLicenseId: updated.teacher_license,
                      schoolReferenceKey: updated.school_key,
                      markedAt: updated.verified_at || new Date().toISOString(),
                      token: updated.marking_token || "",
                    }
                  : undefined;

              // Update local project with synced data
              upsert({
                ...localProject,
                status: updated.status,
                submissionId: updated.id,
                teacherMark,
                grade1: updated.phase1_score?.toString() || localProject.grade1,
                grade2: updated.phase2_score?.toString() || localProject.grade2,
                grade3: updated.phase3_score?.toString() || localProject.grade3,
                grade4: updated.phase4_score?.toString() || localProject.grade4,
                syncedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, list, upsert]);

  // Function to sync a project to Supabase
  const syncProject = useCallback(
    async (project: Project, orgId?: string) => {
      if (!userId) return null;

      setSyncing(true);
      try {
        const { data, error } = await supabase
          .from("project_submissions")
          .upsert({
            id: project.submissionId || undefined,
            student_id: userId,
            org_id: orgId,
            project_data: project as any,
            status: project.status,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local project with submission ID
        upsert({
          ...project,
          submissionId: data.id,
          syncedAt: new Date().toISOString(),
        });

        return data;
      } catch (err) {
        console.error("Sync failed:", err);
        return null;
      } finally {
        setSyncing(false);
      }
    },
    [userId, upsert],
  );

  return { syncing, syncProject };
}
