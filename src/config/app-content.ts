/**
 * ============================================================================
 * SINGLE SOURCE OF TRUTH: APPLICATION CONTENT & ROLE-SPECIFIC CONFIGURATION
 * ============================================================================
 * Consolidates all static UI copy, role-specific labels, form placeholders,
 * and curriculum metadata to prevent hardcoded fragments across components.
 * ============================================================================
 */

import { UserRole } from "@/hooks/useUserRole";

export interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  icon?: string;
}

export interface QuickActionItem {
  title: string;
  description: string;
  to: string;
  iconName: string;
  badge?: string;
  accentColor?: string;
}

export interface RoleDashboardData {
  title: string;
  badge: string;
  subtitle: string;
  portalDescription: string;
  primaryAction: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
  quickActions: QuickActionItem[];
  defaultMetrics: DashboardMetric[];
  statusMessage: string;
}

export const APP_CONFIG = {
  name: "Lattys Cymatic Study",
  brandSubtitle: "Uganda Secondary Curriculum Learning & Evaluation System",
  curriculumStandard: "NCDC Competence-Based Lower Secondary Curriculum (O-Level)",
  partner: "Pash Media & Uganda Ministry of Education Guidelines",
  version: "3.4.0",
  year: "2026",
  supportEmail: "support@cymaticstudy.ug",
  defaultSchoolId: "SCH-UG-2026",
};

export const AUTH_CONTENT = {
  login: {
    title: "Access Academic Portal",
    subtitle: "Sign in with your student, teacher, or institutional administrator credentials.",
    emailPlaceholder: "scholar@school.ug or email address",
    passwordPlaceholder: "Enter your secure password",
    magicLinkPrompt: "Or receive a one-click magic link via email",
    guestNotice: "Exploring as a guest? Preview mode provides limited sample activities.",
    submitButton: "Sign In to Workspace",
    guestButton: "Continue in Preview Mode",
  },
  signup: {
    title: "Create Academic Account",
    subtitle: "Join the verified national curriculum study network.",
    roleSelectionLabel: "Select Your Academic Role",
    schoolIdPlaceholder: "Enter School Code (e.g. SCH-KAMPALA-01)",
    namePlaceholder: "Full Legal Name",
    emailPlaceholder: "name@domain.ug",
    passwordPlaceholder: "Create a strong password (min 6 characters)",
    submitButton: "Initialize Account",
  },
  roleDescriptions: {
    student:
      "Access interactive syllabus notes, Socratic AI tutor, auto-graded quizzes, and practice logs.",
    teacher:
      "Grade student assessments, mark CBC activities of integration, monitor class progress, and set quizzes.",
    admin:
      "Manage school license keys, register teaching staff, oversee institutional analytics, and configure syllabi.",
  },
};

export const ROLE_CONFIGS: Record<UserRole, RoleDashboardData> = {
  student: {
    title: "Student Learning Hub",
    badge: "Student Portal",
    subtitle: "Competence-Based study tracks, interactive labs, and Socratic AI guidance.",
    portalDescription:
      "Work on daily syllabus missions, earn competence badges, and prepare for UNEB assessments.",
    primaryAction: { label: "Launch AI Tutor", to: "/tutor" },
    secondaryAction: { label: "Take Quick Quiz", to: "/quizzes" },
    quickActions: [
      {
        title: "Socratic AI Tutor",
        description:
          "Guided inquiry and step-by-step concept explanations across all O-Level subjects.",
        to: "/tutor",
        iconName: "Sparkles",
        badge: "Adaptive",
        accentColor: "cyan",
      },
      {
        title: "Daily Practice Quizzes",
        description: "Diagnostic self-tests aligned with NCDC competence benchmarks.",
        to: "/quizzes",
        iconName: "Lightbulb",
        accentColor: "amber",
      },
      {
        title: "Interactive Lessons & Notes",
        description: "Modular study notes with audio read-aloud and real-world examples.",
        to: "/lessons",
        iconName: "BookOpen",
        accentColor: "emerald",
      },
      {
        title: "Project Portfolios",
        description:
          "Document Activities of Integration (AOI) and upload community project evidence.",
        to: "/projects",
        iconName: "FileCode",
        accentColor: "blue",
      },
    ],
    defaultMetrics: [
      { id: "active_subjects", label: "Enrolled Subjects", value: 8 },
      { id: "completed_quizzes", label: "Quizzes Completed", value: 24, change: "+3 this week" },
      { id: "competence_score", label: "Competence Level", value: "Level 3 (Proficient)" },
      { id: "study_streak", label: "Active Day Streak", value: "7 Days" },
    ],
    statusMessage: "Active Academic Term — Senior 3 & 4 Milestone Preparation",
  },
  teacher: {
    title: "Faculty Assessment & Grading Hub",
    badge: "Educator Workspace",
    subtitle:
      "Evaluate student Activities of Integration (AOI), monitor progress, and guide student achievement.",
    portalDescription:
      "Review student submissions against 3-point NCDC rubrics and generate continuous assessment scores.",
    primaryAction: { label: "Open Marking Desk", to: "/marking" },
    secondaryAction: { label: "View Class Roster", to: "/student" },
    quickActions: [
      {
        title: "Marking & Evaluation Desk",
        description:
          "Grade student project submissions with criteria-based rubric scoring (Score 1-3).",
        to: "/marking",
        iconName: "CheckCircle",
        badge: "Pending Tasks",
        accentColor: "teal",
      },
      {
        title: "Curriculum Alignment Guide",
        description:
          "Check syllabus coverage, competency learning outcomes, and assessment guides.",
        to: "/curriculum",
        iconName: "BookOpen",
        accentColor: "emerald",
      },
      {
        title: "Class Analytics & Reports",
        description:
          "Inspect performance curves, identify knowledge gaps, and export printable continuous assessment reports.",
        to: "/analytics",
        iconName: "LineChart",
        accentColor: "indigo",
      },
      {
        title: "Quiz Generator",
        description: "Generate diagnostic quizzes and assign them to specific class streams.",
        to: "/quizzes",
        iconName: "Lightbulb",
        accentColor: "purple",
      },
    ],
    defaultMetrics: [
      {
        id: "pending_submissions",
        label: "Pending Evaluations",
        value: 14,
        change: "Requires review",
      },
      { id: "marked_this_term", label: "Activities Graded", value: 142 },
      { id: "class_average", label: "Curriculum Mastery", value: "78.4%" },
      { id: "active_students", label: "Monitored Students", value: 86 },
    ],
    statusMessage: "Term Continuous Assessment Active — Rubrics Loaded",
  },
  admin: {
    title: "Institutional Command Center",
    badge: "Administration",
    subtitle:
      "Manage school infrastructure, faculty credentials, syllabus compliance, and audit logs.",
    portalDescription:
      "Deploy school ID keys, monitor student engagement metrics, and supervise curriculum delivery.",
    primaryAction: { label: "Institutional Console", to: "/admin/dashboard" },
    secondaryAction: { label: "Staff Roster", to: "/teacher" },
    quickActions: [
      {
        title: "Institutional Administration",
        description:
          "Configure school branding, verify teacher accounts, and issue student login codes.",
        to: "/admin/dashboard",
        iconName: "ShieldCheck",
        badge: "System Core",
        accentColor: "blue",
      },
      {
        title: "Teacher Evaluation Station",
        description: "Oversee faculty grading pace and continuous assessment recording standards.",
        to: "/teacher",
        iconName: "PenTool",
        accentColor: "teal",
      },
      {
        title: "National Curriculum Audit",
        description:
          "Track alignment with latest Ministry of Education circulars and NCDC guidelines.",
        to: "/curriculum",
        iconName: "BookOpen",
        accentColor: "indigo",
      },
      {
        title: "System Diagnostics & Logs",
        description: "Inspect database sync status, security events, and offline cache health.",
        to: "/analytics",
        iconName: "LineChart",
        accentColor: "slate",
      },
    ],
    defaultMetrics: [
      { id: "enrolled_scholars", label: "Total Students", value: 420 },
      { id: "active_teachers", label: "Verified Faculty", value: 18 },
      { id: "curriculum_coverage", label: "Syllabus Coverage", value: "92%" },
      { id: "system_status", label: "Database Sync", value: "Operational (Live)" },
    ],
    statusMessage: "Institutional Verification Active — All Gateways Online",
  },
};

/**
 * Accessor to get structured dashboard configuration for any role
 */
export function getDashboardConfig(role: UserRole = "student"): RoleDashboardData {
  return ROLE_CONFIGS[role] || ROLE_CONFIGS.student;
}

export default APP_CONFIG;
