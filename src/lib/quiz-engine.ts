import { QUIZ_DB_CONNECTION_STRING } from "./points-engine";
import { quizQuestions, type QuizQuestion } from "@/data/quizzes";

export { QUIZ_DB_CONNECTION_STRING };

export interface DynamicDailyTask {
  id: string;
  title: string;
  subject: "Math" | "Physics" | "Chemistry" | "Biology";
  description: string;
  taskType: "quiz" | "project" | "interactive_question";
  points: number;
  isCompleted: boolean;
  priority: boolean;
  snoozed: boolean;
  snoozeCount: number;
  tutorExplanation: string;
  quizQuestions?: QuizQuestion[];
  created_by: "tutor" | "teacher" | "admin";
  created_at: string;
}

const DEFAULT_TASKS: DynamicDailyTask[] = [
  {
    id: "task-math-1",
    title: "Mastering Quadratic Discriminants",
    subject: "Math",
    description:
      "Explain why a quadratic equation ax² + bx + c = 0 has no real roots when b² - 4ac < 0. Provide 2 numerical examples.",
    taskType: "interactive_question",
    points: 15,
    isCompleted: false,
    priority: true,
    snoozed: false,
    snoozeCount: 0,
    tutorExplanation:
      "When the discriminant b² - 4ac is negative, taking its square root yields an imaginary number, meaning the parabola of the quadratic equation does not cross the x-axis. Thus, no real roots exist.",
    created_by: "tutor",
    created_at: new Date().toISOString(),
  },
  {
    id: "task-phys-1",
    title: "Standing Sound Waves",
    subject: "Physics",
    description:
      "Examine resonance in a closed tube. If the fundamental frequency is 256 Hz (Middle C), find the frequency of the first two overtones.",
    taskType: "project",
    points: 25,
    isCompleted: false,
    priority: false,
    snoozed: false,
    snoozeCount: 0,
    tutorExplanation:
      "For closed tubes, only odd harmonics exist. The fundamental is f₁ = 256 Hz. The first overtone is the 3rd harmonic: f₃ = 3 * f₁ = 768 Hz. The second overtone is the 5th harmonic: f₅ = 5 * f₁ = 1280 Hz.",
    created_by: "tutor",
    created_at: new Date().toISOString(),
  },
  {
    id: "task-chem-1",
    title: "S1 Formula Balancing Challenge",
    subject: "Chemistry",
    description:
      "Balance the combustion reaction of propane: C₃H₈ + O₂ → CO₂ + H₂O. Identify the stoichiometric coefficient of oxygen.",
    taskType: "quiz",
    points: 15,
    isCompleted: false,
    priority: false,
    snoozed: false,
    snoozeCount: 0,
    tutorExplanation:
      "To balance: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. The stoichiometric coefficient of oxygen is 5.",
    created_by: "tutor",
    created_at: new Date().toISOString(),
  },
  {
    id: "task-bio-1",
    title: "Cell Mitosis Sequence Quiz",
    subject: "Biology",
    description:
      "Recall the phases of mitosis in order. Explain the primary distinction between anaphase and telophase.",
    taskType: "quiz",
    points: 10,
    isCompleted: false,
    priority: false,
    snoozed: false,
    snoozeCount: 0,
    tutorExplanation:
      "The phases are Prophase, Metaphase, Anaphase, Telophase (PMAT). During anaphase, sister chromatids are pulled apart to opposite poles. During telophase, nuclear membranes reform around each set of chromosomes.",
    created_by: "tutor",
    created_at: new Date().toISOString(),
  },
];

export const QuizEngine = {
  /**
   * Loads tasks from local storage or returns the default tutor tasks
   */
  getTasks(): DynamicDailyTask[] {
    if (typeof window === "undefined") return DEFAULT_TASKS;
    const stored = localStorage.getItem("tutor_orchestrated_tasks");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse tutor orchestrated tasks:", e);
      }
    }
    // Initialize
    localStorage.setItem("tutor_orchestrated_tasks", JSON.stringify(DEFAULT_TASKS));
    return DEFAULT_TASKS;
  },

  /**
   * Saves task state
   */
  saveTasks(tasks: DynamicDailyTask[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem("tutor_orchestrated_tasks", JSON.stringify(tasks));
      // Dispatch storage event to alert other components
      window.dispatchEvent(new Event("storage"));
    }
  },

  /**
   * Tutor Orchestrator:
   * Generates a dynamic task for the user based on custom study progress or topic interactions.
   */
  generateTutorTaskForUser(
    subject: "Math" | "Physics" | "Chemistry" | "Biology",
    recentTopicName?: string,
  ): DynamicDailyTask {
    const tasks = this.getTasks();
    const id = `task-tutor-dyn-${Date.now()}`;

    // Choose template or generate dynamically
    let title = "";
    let description = "";
    let taskType: "quiz" | "project" | "interactive_question" = "quiz";
    let points = 15;
    let tutorExplanation = "";

    const topicDesc = recentTopicName
      ? `related to "${recentTopicName}"`
      : "under the Lower Secondary Curriculum";

    if (subject === "Math") {
      title = `Personalized Math: Solving Linear Inequations`;
      description = `Find the integer solutions for 3x - 4 < 2x + 5 ${topicDesc}. Show your step-by-step inequalities.`;
      taskType = "interactive_question";
      points = 15;
      tutorExplanation =
        "By adding 4 to both sides: 3x < 2x + 9. By subtracting 2x: x < 9. The integer solutions are all integers strictly less than 9.";
    } else if (subject === "Physics") {
      title = `Personalized Physics: Force & Motion Practical`;
      description = `A 5kg mass is subject to a constant net force of 15 Newtons. Calculate its acceleration and explain Newton's Second Law ${topicDesc}.`;
      taskType = "project";
      points = 20;
      tutorExplanation =
        "Using Newton's Second Law F = ma, the acceleration a = F/m = 15N / 5kg = 3 m/s². The law states acceleration is directly proportional to net force and inversely proportional to mass.";
    } else if (subject === "Chemistry") {
      title = `Personalized Chemistry: Acid Strength & pH`;
      description = `Explain the difference between a strong acid (like hydrochloric acid) and a weak acid (like ethanoic acid) in aqueous solution ${topicDesc}.`;
      taskType = "quiz";
      points = 15;
      tutorExplanation =
        "Strong acids completely dissociate into hydrogen ions in solution. Weak acids only partially dissociate, leading to an equilibrium mixture and a higher pH value at identical concentrations.";
    } else {
      title = `Personalized Biology: Photosynthesis Rate`;
      description = `Describe the raw materials, products, and how light intensity influences the rate of photosynthesis ${topicDesc}.`;
      taskType = "quiz";
      points = 15;
      tutorExplanation =
        "Raw materials: Carbon dioxide and water. Products: Glucose and oxygen. Light intensity increases the rate of photosynthesis until a saturation point is reached, where other factors like CO2 concentration or temperature become limiting.";
    }

    const newTask: DynamicDailyTask = {
      id,
      title,
      subject,
      description,
      taskType,
      points,
      isCompleted: false,
      priority: false,
      snoozed: false,
      snoozeCount: 0,
      tutorExplanation,
      created_by: "tutor",
      created_at: new Date().toISOString(),
    };

    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  },

  /**
   * Teacher & Admin Creator Tool:
   * Enables teachers and administrators to create tailored tasks manually for the dashboard.
   */
  createManualTask(opts: {
    title: string;
    subject: "Math" | "Physics" | "Chemistry" | "Biology";
    description: string;
    taskType: "quiz" | "project" | "interactive_question";
    points: number;
    tutorExplanation: string;
    created_by: "teacher" | "admin";
  }): DynamicDailyTask {
    const tasks = this.getTasks();
    const newTask: DynamicDailyTask = {
      id: `task-manual-${Date.now()}`,
      title: opts.title,
      subject: opts.subject,
      description: opts.description,
      taskType: opts.taskType,
      points: opts.points,
      isCompleted: false,
      priority: false,
      snoozed: false,
      snoozeCount: 0,
      tutorExplanation:
        opts.tutorExplanation ||
        "A custom assignment verified safe by Lattys Cymatic Study authorities.",
      created_by: opts.created_by,
      created_at: new Date().toISOString(),
    };

    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  },

  /**
   * Marks a specific task completed and registers its points.
   */
  completeTask(id: string): DynamicDailyTask | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return null;

    tasks[taskIndex].isCompleted = true;
    this.saveTasks(tasks);
    return tasks[taskIndex];
  },

  /**
   * Sets priority status for a task
   */
  setPriority(id: string, priority: boolean): DynamicDailyTask | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return null;

    tasks[taskIndex].priority = priority;
    this.saveTasks(tasks);
    return tasks[taskIndex];
  },

  /**
   * Snoozes a task
   */
  snoozeTask(id: string): DynamicDailyTask | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return null;

    tasks[taskIndex].snoozed = true;
    tasks[taskIndex].snoozeCount += 1;
    this.saveTasks(tasks);
    return tasks[taskIndex];
  },

  /**
   * Restores a snoozed task
   */
  unsnoozeTask(id: string): DynamicDailyTask | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return null;

    tasks[taskIndex].snoozed = false;
    this.saveTasks(tasks);
    return tasks[taskIndex];
  },
};
