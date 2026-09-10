/**
 * Google structured data schemas (JSON-LD) for Educational Course and FAQ content
 * strictly aligned with Google's guidelines for all Uganda NCDC subjects (ICT, Geography,
 * Mathematics, Physics, Chemistry, Biology, Kiswahili, Luganda, etc.) and Senior classes (S1-S6).
 */

import { BRAND } from "@/lib/constants";

import { z } from "zod";

export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  media_url: z.string().nullable(),
  media_type: z.string().nullable(),
  category: z.string().nullable(),
  published_at: z.string(),
  is_ad: z.boolean().optional(),
  priority: z.string().optional(),
  is_active: z.boolean().optional(),
});

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  role: string | null;
  org_id: string | null;
  level: string | null;
  stream: string | null;
  tutor_persona: string | null;
  referral_code: string | null;
  created_at: string | null;
}

export const ProfileSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  display_name: z.string().nullable(),
  role: z.string().nullable(),
  org_id: z.string().nullable(),
  level: z.string().nullable(),
  stream: z.string().nullable(),
  tutor_persona: z.string().nullable(),
  referral_code: z.string().nullable(),
  created_at: z.string().nullable(),
});

export interface ProjectSubmission {
  id: string;
  student_id: string;
  student_name: string | null;
  school_id: string | null;
  org_id: string | null;
  level: string | null;
  stream: string | null;
  subject: string | null;
  project_title: string | null;
  project_description: string | null;
  created_at: string | null;
  score: number | null;
  feedback: string | null;
  teacher_name: string | null;
}

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  created_at: z.string().optional(),
});

export const DashboardTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  description: z.string(),
  task_type: z.string(),
  points: z.number(),
  tutor_explanation: z.string().optional().nullable(),
  created_by: z.string().optional().nullable(),
  organization_id: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export type DashboardTask = z.infer<typeof DashboardTaskSchema>;

export const ContentInteractionSchema = z.object({
  id: z.string().optional(),
  content_id: z.string(),
  user_id: z.string(),
  is_liked: z.boolean().default(false),
  is_bookmarked: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ContentInteraction = z.infer<typeof ContentInteractionSchema>;

export const ProjectSubmissionSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  student_name: z.string().nullable(),
  school_id: z.string().nullable(),
  org_id: z.string().nullable(),
  level: z.string().nullable(),
  stream: z.string().nullable(),
  subject: z.string().nullable(),
  project_title: z.string().nullable(),
  project_description: z.string().nullable(),
  created_at: z.string().nullable(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  teacher_name: z.string().nullable(),
});

export interface JSONLDSchema {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

// Full array of NCDC aligned curriculum subjects with SEO targets
export const NCDC_SUBJECTS = [
  {
    id: "math",
    title: "Mathematics",
    category: "MAT",
    desc: "Algebra, Geometry, Trigonometry, Statistics, and simultaneous quadratic models.",
  },
  {
    id: "physics",
    title: "Physics",
    category: "PHY",
    desc: "Mechanics, Heat, Light, Wave Interference, Electricity, and Modern Physics.",
  },
  {
    id: "chemistry",
    title: "Chemistry",
    category: "CHM",
    desc: "Atomic structure, chemical equations, volumetric analysis, and organic carbon compounds.",
  },
  {
    id: "biology",
    title: "Biology",
    category: "BIO",
    desc: "Cell biology, ecology, human physiology, plant growth, classification, and genetics.",
  },
  {
    id: "ict",
    title: "ICT (Information & Communication Tech)",
    category: "ICT",
    desc: "Digital systems, networks, database queries, spreadsheet analysis, and web development.",
  },
  {
    id: "geography",
    title: "Geography",
    category: "GEO",
    desc: "Physical geography, human settlement, map reading, East Africa, and climate change.",
  },
  {
    id: "history",
    title: "History & Political Education",
    category: "HIS",
    desc: "East African history, regional integration, citizenship, and constitutional development.",
  },
  {
    id: "kiswahili",
    title: "Kiswahili",
    category: "KIS",
    desc: "Fasihi, sarufi, matumizi ya lugha, and vocabulary development.",
  },
  {
    id: "luganda",
    title: "Luganda",
    category: "LUG",
    desc: "Enfumo, empisa, olulimi, and cultural literature of Buganda.",
  },
];

export const NCDC_CLASSES = [
  { level: 1, label: "Senior 1", code: "S1", termLabel: "UCE Lower" },
  { level: 2, label: "Senior 2", code: "S2", termLabel: "UCE Lower" },
  { level: 3, label: "Senior 3", code: "S3", termLabel: "UCE Mid" },
  { level: 4, label: "Senior 4", code: "S4", termLabel: "UCE Exit" },
  { level: 5, label: "Senior 5", code: "S5", termLabel: "UACE Advanced" },
  { level: 6, label: "Senior 6", code: "S6", termLabel: "UACE Exit" },
];

/**
 * Dynamically builds Google-compliant Educational Course Schema
 */
export function getSubjectCourseSchema(subjectId: string, classLevel: number): JSONLDSchema | null {
  const subject = NCDC_SUBJECTS.find((s) => s.id === subjectId);
  const classObj = NCDC_CLASSES.find((c) => c.level === classLevel);

  if (!subject || !classObj) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${classObj.label} ${subject.title} — ${BRAND.name}`,
    description: `Official ${classObj.label} secondary course for ${subject.title} fully aligned with the Uganda National Curriculum Development Centre (NCDC). Includes practice worksheets, UNEB revision tools, and Socratic AI interactive study aids.`,
    courseCode: `${subject.category}-${classObj.code}`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Blended (Offline First / Online Synchronized)",
      educationalCredentialAwarded: `${classObj.termLabel} Academic Progress Milestone`,
      instructor: {
        "@type": "Person",
        name: "Isabirye Latif",
        jobTitle: "Socratic Learning Architect",
      },
    },
    provider: {
      "@type": "Organization",
      name: "Latty's Cymatic Study",
      alternateName: BRAND.aliases,
      url: "https://study.cymatichub.xyz",
    },
  };
}

/**
 * Dynamically generates Google-compliant FAQ Schema mapped to high-intent curriculum questions
 */
export function getCurriculumFAQSchema(subjectId: string, classLevel: number): JSONLDSchema | null {
  const subject = NCDC_SUBJECTS.find((s) => s.id === subjectId);
  const classObj = NCDC_CLASSES.find((c) => c.level === classLevel);

  if (!subject || !classObj) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How does the ${classObj.label} ${subject.title} syllabus align with NCDC requirements?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Our ${classObj.label} ${subject.title} materials are continuously updated and cross-verified with the National Curriculum Development Centre (NCDC) New Lower Secondary Curriculum guidelines to support activities, projects, and thematic grading.`,
        },
      },
      {
        "@type": "Question",
        name: `Can S1-S6 learners practice ${subject.title} offline?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! The platform utilizes offline-first caching via Service Workers and IndexedDB. You can load courses, study lesson guides, and run interactive mock quizzes without an active internet connection.",
        },
      },
    ],
  };
}

/**
 * Compiles a comprehensive index of all NCDC class courses
 */
export function buildAllNCDCCourses(): JSONLDSchema[] {
  const schemas: JSONLDSchema[] = [];

  NCDC_SUBJECTS.forEach((subject) => {
    NCDC_CLASSES.forEach((classObj) => {
      const course = getSubjectCourseSchema(subject.id, classObj.level);
      const faq = getCurriculumFAQSchema(subject.id, classObj.level);
      if (course) schemas.push(course);
      if (faq) schemas.push(faq);
    });
  });

  return schemas;
}

/**
 * Maps standard curriculum headlines to typical high-intent search questions
 * written by learners/educators in Uganda to maximize crawlability and organic visibility.
 */
export function mapHeadlineToSearchQuestion(
  subjectId: string,
  headline: string,
): { question: string; answer: string } {
  const norm = headline.toLowerCase();
  let question = `Where can I find study notes for ${headline} in Uganda secondary schools?`;
  let answer = `Detailed NCDC-aligned interactive notes, peer-verified projects, and worksheets for ${headline} are available on Lattys Cymatic Study.`;

  if (subjectId === "math") {
    if (norm.includes("equation") || norm.includes("algebra")) {
      question =
        "How do I solve linear and quadratic equations according to the NCDC Mathematics syllabus?";
      answer =
        "Linear and quadratic equations are core components of the S1-S4 math curriculum. Step-by-step methods, practice worksheets, and graphical models can be reviewed in our Socratic practice hub.";
    } else if (norm.includes("trig") || norm.includes("geometry")) {
      question = "What are the key geometry and trigonometry formulas for S3-S4 UNEB Mathematics?";
      answer =
        "The UNEB Mathematics syllabus tests Pythagoras' theorem, trigonometric ratios (Sine, Cosine, Tangent), and volume calculations for 3D shapes. Get worksheets on our study hub.";
    }
  } else if (subjectId === "physics") {
    if (norm.includes("mechanic") || norm.includes("force") || norm.includes("motion")) {
      question = "What are Newton's laws of motion for S1 and S2 Physics classes?";
      answer =
        "Newton's three laws of motion explain force, mass, and acceleration. These concepts are mapped to Uganda NCDC practical science experiments on Lattys Cymatic Study.";
    } else if (norm.includes("light") || norm.includes("optics") || norm.includes("lens")) {
      question = "How do light reflection and refraction work in secondary school physics?";
      answer =
        "Reflection on plane surfaces, refractive indices, and concave/convex lenses are key topics in S3 Physics. Find visual ray diagrams and practice quizzes on our science desk.";
    }
  } else if (subjectId === "chemistry") {
    if (norm.includes("atom") || norm.includes("periodic")) {
      question = "What is atomic structure and the periodic table in the S1 Chemistry syllabus?";
      answer =
        "S1 Chemistry introduces protons, neutrons, electrons, and the first 20 elements of the periodic table. Our interactive cards provide simple atomic models.";
    } else if (norm.includes("volume") || norm.includes("mole")) {
      question =
        "How do you calculate molarity in volumetric analysis for UNEB Chemistry practicals?";
      answer =
        "Volumetric analysis involves acid-base titrations to find unknown concentrations using formulas like M1V1 = M2V2. Standard mock procedures are detailed in our chemistry desk.";
    }
  } else if (subjectId === "ict") {
    if (norm.includes("word") || norm.includes("database") || norm.includes("spread")) {
      question = "What database and spreadsheet practical skills are required for S1-S4 ICT?";
      answer =
        "Students must master Microsoft Excel formulas (SUM, AVERAGE, IF) and Access queries. We host specific practice guides aligned with NCDC digital literacy requirements.";
    }
  }

  return { question, answer };
}

/**
 * Generates an FAQPage schema for a collection of curriculum chapter headlines
 */
export function generateHeadlinesFAQSchema(subjectId: string, headlines: string[]): JSONLDSchema {
  const mainEntity = headlines.map((headline) => {
    const { question, answer } = mapHeadlineToSearchQuestion(subjectId, headline);
    return {
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: mainEntity,
  };
}
