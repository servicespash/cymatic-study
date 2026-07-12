import { supabase } from "@/integrations/supabase/client";

function scoreToGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

function attachMark(project: any, row: any) {
  if (!row.is_verified || row.awarded_score == null || !row.awarded_grade || !row.verified_at) {
    return project;
  }
  return {
    ...project,
    teacherMark: {
      score: row.awarded_score,
      grade: row.awarded_grade,
      comment: row.remarks ?? "",
      teacherName: row.marked_by ?? undefined,
      teacherTitle: row.teacher_title ?? undefined,
      teacherLicenseId: row.teacher_license_id ?? undefined,
      schoolReferenceKey: row.school_reference_key ?? undefined,
      markedAt: row.verified_at,
      token: row.teacher_token,
    },
  };
}

export async function submitProjectForMarking(data: {
  project: any;
  studentEmail?: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const project = data.project;
  const email = data.studentEmail ?? user.email ?? null;
  const existingToken = project.markingToken;

  if (existingToken) {
    const { data: existing } = await supabase
      .from("project_submissions")
      .select("id,is_verified,student_user_id,teacher_token")
      .eq("teacher_token", existingToken)
      .maybeSingle();

    if (existing) {
      if (existing.student_user_id !== user.id) {
        throw new Error("This marking token belongs to another student account.");
      }
      if (!existing.is_verified) {
        await supabase
          .from("project_submissions")
          .update({ project_payload: project, student_email: email })
          .eq("id", existing.id);
      }
      return {
        token: existing.teacher_token,
        submissionId: existing.id,
        verified: existing.is_verified,
      };
    }
  }

  const { data: created, error } = await supabase
    .from("project_submissions")
    .insert({
      project_id: project.id,
      student_user_id: user.id,
      student_email: email,
      project_payload: project,
    })
    .select("id,teacher_token")
    .single();

  if (error) throw new Error(error.message);
  return { token: created.teacher_token, submissionId: created.id, verified: false };
}

export async function getProjectSubmissionForMarking(data: { token: string }) {
  const { data: row, error } = await supabase
    .from("project_submissions")
    .select("*")
    .eq("teacher_token", data.token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("This assessment token was not found.");

  return {
    submissionId: row.id,
    token: row.teacher_token,
    project: attachMark(row.project_payload, row),
    isVerified: row.is_verified,
  };
}

export async function verifyProjectSubmission(data: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing } = await supabase
    .from("project_submissions")
    .select("id,student_user_id,is_verified")
    .eq("teacher_token", data.token)
    .maybeSingle();

  if (!existing) throw new Error("This assessment token was not found.");
  if (existing.student_user_id === user.id) {
    throw new Error("Forbidden: a student cannot verify their own submission.");
  }
  if (existing.is_verified) throw new Error("This submission has already been verified.");

  const { data: roleRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = roleRow?.role ?? "";
  if (!["teacher", "independent_teacher", "school_admin", "admin"].includes(role)) {
    throw new Error("Forbidden: only teachers or admins can verify submissions.");
  }

  const grade = scoreToGrade(data.score);
  const { data: row, error } = await supabase
    .from("project_submissions")
    .update({
      is_verified: true,
      status: "verified",
      teacher_id: user.id,
      awarded_score: data.score,
      awarded_grade: grade,
      remarks: data.comment,
      marked_by: data.teacherName?.trim() || null,
      teacher_title: data.teacherTitle?.trim() || null,
      teacher_license_id: data.teacherLicenseId?.trim() || null,
      school_reference_key: data.schoolReferenceKey?.trim() || null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return {
    submissionId: row.id,
    token: row.teacher_token,
    project: attachMark(row.project_payload, row),
    isVerified: row.is_verified,
  };
}

export async function submitTeacherEvaluation(data: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: roleRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!["teacher", "independent_teacher", "school_admin", "admin"].includes(roleRow?.role ?? "")) {
    throw new Error("Forbidden: only teachers or admins can submit evaluations.");
  }

  const { data: existing } = await supabase
    .from("project_submissions")
    .select("id,student_user_id,status")
    .eq("id", data.submissionId)
    .maybeSingle();

  if (!existing) throw new Error("Submission not found.");
  if (existing.student_user_id === user.id) throw new Error("Forbidden: cannot evaluate your own.");
  if (existing.status === "verified") throw new Error("Already verified.");

  const total = data.phase1 + data.phase2 + data.phase3 + data.phase4;
  const { error } = await supabase
    .from("project_submissions")
    .update({
      status: "verified",
      is_verified: true,
      teacher_id: user.id,
      teacher_name: data.teacherName,
      teacher_license: data.license,
      school_key: data.schoolKey,
      teacher_comments: data.comments,
      phase1_score: data.phase1,
      phase2_score: data.phase2,
      phase3_score: data.phase3,
      phase4_score: data.phase4,
      total_competency_score: total,
      verified_at: new Date().toISOString(),
    })
    .eq("id", data.submissionId);

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function loadMyDraftSubmission() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("project_submissions")
    .select(
      "id,status,project_data,phase1_score,phase2_score,phase3_score,phase4_score,total_competency_score,teacher_name,teacher_comments,verified_at,is_verified",
    )
    .eq("student_user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function syncMyDraftSubmission(data: { projectData: any }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("project_submissions")
    .select("id,status,is_verified")
    .eq("student_user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.is_verified) throw new Error("Submission already verified.");

  if (existing) {
    const { data: updated, error } = await supabase
      .from("project_submissions")
      .update({
        project_data: data.projectData,
        status: existing.status === "draft" ? "pending" : existing.status,
        org_id: profile?.org_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id,status")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  }

  const { data: created, error } = await supabase
    .from("project_submissions")
    .insert({
      student_user_id: user.id,
      student_id: user.id,
      org_id: profile?.org_id ?? null,
      project_data: data.projectData,
      status: "pending",
    })
    .select("id,status")
    .single();

  if (error) throw new Error(error.message);
  return created;
}
