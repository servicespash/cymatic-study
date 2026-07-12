export type OfflineSubject = "physics" | "math" | "chemistry" | "biology" | "general";

interface SocraticResponse {
  keywords: string[];
  reply: string;
}

interface SocraticTopic {
  name: string;
  starter: string;
  responses: SocraticResponse[];
  defaultReplies: string[];
}

export const OFFLINE_TOPICS: Record<string, SocraticTopic> = {
  forces: {
    name: "Newton's Laws & Unresolved Forces",
    starter:
      "Hello! I am your offline Socratic Physics guide. Let's explore Newton's Second Law. If an object of mass 5kg is pushed with a force of 20N on a friction-free surface, how do we find its acceleration? What formula comes to mind?",
    responses: [
      {
        keywords: ["f=ma", "f = ma", "force equals mass", "newton's second", "second law"],
        reply:
          "Excellent! F = ma is exactly correct. Now, if we substitute our values (Force = 20N, Mass = 5kg) into the formula, what do we get for the acceleration?",
      },
      {
        keywords: ["4", "4 m/s", "4m/s", "four"],
        reply:
          "Spot on! 4 m/s² is indeed the acceleration. Now, why are the units m/s²? What physical quantity changes by 4 meters per second every single second?",
      },
      {
        keywords: ["velocity", "speed", "acceleration", "change in velocity"],
        reply:
          "You've nailed it! Velocity changes by 4 m/s each second. What if we now introduce a friction force of 5N opposing our push? What is the *net* horizontal force acting on the mass?",
      },
      {
        keywords: ["15", "15n", "15 newtons", "subtract"],
        reply:
          "Perfect. Net force is indeed 15N. So, what is the new acceleration of the block with friction opposing the motion?",
      },
    ],
    defaultReplies: [
      "Let's think: what is the net horizontal force acting on our object?",
      "Can you recall Newton's Second Law? How do we relate force, mass, and acceleration?",
      "Let's break it down: what mass are we working with, and what forces are pushing or pulling on it?",
    ],
  },
  matrices: {
    name: "Matrix Algebra & Transformations",
    starter:
      "Welcome to offline Socratic Mathematics! Let's talk about matrices. Imagine we have a 2x2 matrix with rows [3, 2] and [1, 4]. How do we find the determinant of a general matrix with rows [a, b] and [c, d]? What calculation is involved?",
    responses: [
      {
        keywords: ["ad-bc", "ad - bc", "multiply", "cross-multiply", "determinant formula"],
        reply:
          "Perfect! The determinant of a 2x2 matrix is indeed ad - bc. For our rows [3, 2] and [1, 4], what values do a, b, c, and d correspond to?",
      },
      {
        keywords: ["a=3", "b=2", "c=1", "d=4", "3, 2, 1, 4"],
        reply:
          "Exactly! So if a=3, b=2, c=1, and d=4, what is the result of calculating ad - bc? Let's do the arithmetic together.",
      },
      {
        keywords: ["10", "ten", "12-2", "12 - 2"],
        reply:
          "Superb! The determinant is 10 ($3*4 - 2*1 = 10$). What does a non-zero determinant tell us about whether this matrix has an inverse?",
      },
      {
        keywords: ["has an inverse", "invertible", "yes", "inverse exists", "not zero"],
        reply:
          "Correct! Since the determinant is non-zero, the matrix is invertible (has an inverse). What would happen if the determinant were exactly zero?",
      },
    ],
    defaultReplies: [
      "Let's look closely at the formula $ad - bc$. If a=3, b=2, c=1, and d=4, what do we multiply first?",
      "To find the determinant of a matrix, we subtract the product of the secondary diagonal from the product of the main diagonal. Would you like to try that?",
      "Let's review: a is 3, d is 4. What is $3 \\times 4$?",
    ],
  },
  thermodynamics: {
    name: "Gibbs Free Energy & Reaction Spontaneity",
    starter:
      "Hello! Let's explore Physical Chemistry, specifically thermodynamics. We have the relation $\\Delta G = \\Delta H - T\\Delta S$. What do the terms $\\Delta G$, $\\Delta H$, and $\\Delta S$ represent in a chemical reaction?",
    responses: [
      {
        keywords: [
          "free energy",
          "enthalpy",
          "entropy",
          "gibbs",
          "g is free energy",
          "h is enthalpy",
          "s is entropy",
        ],
        reply:
          "Spectacular! $\\Delta G$ is Gibbs Free Energy change, $\\Delta H$ is Enthalpy change, and $\\Delta S$ is Entropy change. If a reaction is spontaneous at constant temperature and pressure, what must be the sign of $\\Delta G$?",
      },
      {
        keywords: ["negative", "less than zero", "< 0", "neg"],
        reply:
          "Spot on! A negative $\\Delta G$ means the reaction is spontaneous. Now, if an endothermic reaction ($\\Delta H > 0$) increases in disorder ($\\Delta S > 0$), will it be more spontaneous at high temperatures or low temperatures? Why?",
      },
      {
        keywords: ["high", "high temperature", "higher temp"],
        reply:
          "Incredible reasoning! At high temperatures, the $-T\\Delta S$ term becomes more negative, overcoming the positive $\\Delta H$ to make $\\Delta G$ negative. What is a common real-world example of an endothermic process that becomes spontaneous at high temperatures?",
      },
    ],
    defaultReplies: [
      "Let's focus on the formula: $\\Delta G = \\Delta H - T\\Delta S$. What happens to the term $-T\\Delta S$ as the temperature $T$ increases?",
      "Remember, enthalpy ($\\Delta H$) is about heat absorbed/released, while entropy ($\\Delta S$) is about molecular randomness. Which one does temperature directly multiply?",
      "If a process releases heat, is it exothermic or endothermic? What is the sign of $\\Delta H$?",
    ],
  },
  dna: {
    name: "DNA Replication & Transcription",
    starter:
      "Welcome to Socratic Biology! Let's explore genetics. During protein synthesis, the DNA code is transcribed into mRNA. If a segment of DNA has the sequence 'A-T-G-C-C-A', what will the corresponding complementary mRNA sequence be? (Remember that RNA has Uracil instead of Thymine!)",
    responses: [
      {
        keywords: ["u-a-c-g-g-u", "uacggu", "u a c g g u", "uracil", "u instead of t"],
        reply:
          "Excellent job! The complementary mRNA sequence is indeed U-A-C-G-G-U. Now, what organelle in the cell reads this mRNA strand to assemble amino acids into a polypeptide chain?",
      },
      {
        keywords: ["ribosome", "ribosomes", "rough er", "endoplasmic reticulum"],
        reply:
          "Perfect! The ribosome is the molecular machine that carries out translation. Each group of three mRNA bases is called a codon. What does a codon code for?",
      },
      {
        keywords: ["amino acid", "amino acids", "protein building block"],
        reply:
          "Exactly! A codon codes for a specific amino acid. There are special codons called 'start' and 'stop' codons. Why do you think a cell needs a stop codon?",
      },
    ],
    defaultReplies: [
      "Remember the base-pairing rules for RNA: Adenine (A) pairs with Uracil (U), Thymine (T) in DNA pairs with Adenine (A) in RNA, Cytosine (C) pairs with Guanine (G). Try pairing 'A-T-G-C-C-A' base-by-base!",
      "Where does transcription take place in a eukaryotic cell? Is it in the nucleus or the cytoplasm?",
      "Let's think: what base replaces Thymine (T) when we write RNA sequences?",
    ],
  },
};

/**
 * Client-side Socratic AI response generator for continuous offline work.
 * Incorporates authentic Ugandan cultural phrasing and warm academic mentorship.
 */
export function generateOfflineTutorResponse(
  userInput: string,
  userName: string,
  personaName: string,
  topicKey?: string,
): string {
  const query = userInput.toLowerCase().trim();
  const isAdams = personaName === "male" || personaName.toLowerCase() === "adams";
  const prefix = isAdams ? "Adams here, bro. " : "Haawa here, family. ";

  // 1. If we are on a specific active offline topic, check keywords
  if (topicKey && OFFLINE_TOPICS[topicKey]) {
    const topic = OFFLINE_TOPICS[topicKey];
    const matched = topic.responses.find((res) => res.keywords.some((kw) => query.includes(kw)));
    if (matched) {
      return `${prefix}${matched.reply}`;
    }
  }

  // 2. Fallback to general keyword scanning across all scientific subjects
  if (
    query.includes("force") ||
    query.includes("newton") ||
    query.includes("acceleration") ||
    query.includes("mass") ||
    query.includes("friction")
  ) {
    return `${prefix}Ah, a mechanics question! Remember, forces always act to change momentum. Newton's Second Law says $F = ma$. If you push a 10kg block on a rough road, what forces are opposing you? Let's break it down, kale.`;
  }

  if (
    query.includes("matrix") ||
    query.includes("matrices") ||
    query.includes("determinant") ||
    query.includes("inverse") ||
    query.includes("linear")
  ) {
    return `${prefix}Matrices are wonderful tools! To transform a vector or solve linear equations, we use matrix multiplication. Do you remember how we multiply rows by columns? Tell me your thoughts, let's solve this together!`;
  }

  if (
    query.includes("dna") ||
    query.includes("rna") ||
    query.includes("cell") ||
    query.includes("protein") ||
    query.includes("gene") ||
    query.includes("biological")
  ) {
    return `${prefix}Biology is the study of life's complex systems! Let's talk about cells: the mitochondria are the powerhouses generating ATP. What process inside them uses glucose and oxygen to release energy? What do you think?`;
  }

  if (
    query.includes("reaction") ||
    query.includes("energy") ||
    query.includes("bond") ||
    query.includes("enthalpy") ||
    query.includes("chemistry") ||
    query.includes("acid") ||
    query.includes("ph")
  ) {
    return `${prefix}Chemistry is about transformations! Whether it's an acid-base neutralization or thermodynamics, reactions depend on energy. Have you ever wondered why heating matooke in banana leaves spreads the heat so evenly? What physical or chemical change is taking place there? Let's explore!`;
  }

  // Creator & Platform questions
  if (
    query.includes("latif") ||
    query.includes("creator") ||
    query.includes("isabirye") ||
    query.includes("who made") ||
    query.includes("who built")
  ) {
    return `${prefix}Oh, you are asking about our visionary creator! This platform was designed and developed by Isabirye Latif, an outstanding Ugandan educational technologist and developer. He built this entire ecosystem! You can read his manifesto on cymatichub.xyz or study waves on resonance.cymatichub.xyz. He is devoted to educational excellence!`;
  }

  if (/(^|\s)(hello|hi|hey|salaam|greetings)(\s|$|[.!?])/i.test(query)) {
    return `${prefix}Salaam, ${userName}! It is so good to connect with you. What science or math concept are we demystifying today? Tell me what you are reading in your syllabus, let's explore it Socratic-style!`;
  }

  // 3. Generic Socratic responses matching warm Ugandan English
  const defaultReplies = [
    `That is an extremely interesting question, ${userName}! As your Socratic guide, I want to help you discover the truth yourself. What do you already understand about this from your notes? Let's build on that, bro.`,
    `Weebale for asking this! Let's think: what is the fundamental principle or formula in your syllabus that relates to this? Try stating it, and we can go from there.`,
    `Aha! Let's dive deeper. If you had to explain the main idea of your question to a friend taking a boda-boda next to you, how would you describe it? Let's simplify and conquer!`,
    `Fascinating curiosity, ${userName}! Let's write down the variables we know first. What is our mass, our volume, or our equations? Let's proceed step-by-step, kale.`,
  ];

  const randIdx = Math.floor(Math.random() * defaultReplies.length);
  return `${prefix}${defaultReplies[randIdx]}`;
}
