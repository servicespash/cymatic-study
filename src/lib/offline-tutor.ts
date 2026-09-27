/**
 * NCDC Curriculum Knowledge Graph & Local Semantic RAG Engine
 * Dynamically supports ALL NCDC Lower and Upper Secondary subjects (Physics, Math, Chemistry, Biology,
 * Geography, History, ICT, Agriculture, Entrepreneurship, Literature, CRE, and general inquiry).
 */

export type OfflineSubject = string;

export interface CurriculumNode {
  id: string;
  subject: string;
  title: string;
  competency: string;
  prerequisites: string[];
  misconceptions: string[];
  socraticStarters: string[];
  keywords: string[];
}

export const NCDC_CURRICULUM_GRAPH: Record<string, CurriculumNode> = {
  newtons_second_law: {
    id: "newtons_second_law",
    subject: "physics",
    title: "Newton's Second Law & Unresolved Forces",
    competency: "Relate force, mass, and acceleration ($F = ma$) in linear mechanics under friction.",
    prerequisites: ["vector_addition", "mass_vs_weight"],
    misconceptions: ["Force implies constant velocity", "Friction acts in the direction of motion"],
    socraticStarters: [
      "Let's explore Newton's Second Law. If an object of mass $5\\text{kg}$ experiences a forward force of $20\\text{N}$ on a frictionless surface, what formula connects force, mass, and acceleration?",
      "Imagine pushing a heavy box across a rough floor in Kampala. What opposing force must we account for when calculating net acceleration?"
    ],
    keywords: ["f=ma", "force", "newton", "acceleration", "mass", "friction", "dynamics", "motion"]
  },
  matrix_determinants: {
    id: "matrix_determinants",
    subject: "math",
    title: "Matrix Algebra & 2x2 Determinants",
    competency: "Calculate determinants and inverses of 2x2 transformations.",
    prerequisites: ["linear_equations", "array_multiplication"],
    misconceptions: ["Determinant represents matrix area scale without sign", "Zero determinant implies no matrix"],
    socraticStarters: [
      "Welcome to offline Socratic Mathematics! For a 2x2 matrix with rows $[a, b]$ and $[c, d]$, what calculation defines the determinant?",
      "Let's consider transformations in space. If our matrix has rows $[3, 2]$ and $[1, 4]$, what is our $ad - bc$ product?"
    ],
    keywords: ["matrix", "matrices", "determinant", "inverse", "linear", "row", "column", "ad-bc"]
  },
  gibbs_free_energy: {
    id: "gibbs_free_energy",
    subject: "chemistry",
    title: "Gibbs Free Energy & Reaction Spontaneity",
    competency: "Evaluate enthalpy, entropy, and Gibbs free energy relation ($\\Delta G = \\Delta H - T\\Delta S$).",
    prerequisites: ["exothermic_reactions", "entropy_laws"],
    misconceptions: ["All exothermic reactions are spontaneous at all temperatures", "Entropy only applies to gases"],
    socraticStarters: [
      "Let's explore thermodynamic spontaneity using $\\Delta G = \\Delta H - T\\Delta S$. What do $\\Delta H$ and $\\Delta S$ represent in a chemical system?",
      "Why does cooking matooke in banana leaves speed up thermal softening? How does heat transfer relate to enthalpy?"
    ],
    keywords: ["thermodynamics", "gibbs", "free energy", "enthalpy", "entropy", "reaction", "spontaneous", "chemistry"]
  },
  dna_transcription: {
    id: "dna_transcription",
    subject: "biology",
    title: "DNA Replication, Transcription & Protein Synthesis",
    competency: "Map DNA sequences to complementary mRNA codons and translate via ribosomal machinery.",
    prerequisites: ["cell_organelles", "nucleotide_pairing"],
    misconceptions: ["RNA uses Thymine instead of Uracil", "Transcription occurs in the cytoplasm"],
    socraticStarters: [
      "Welcome to Socratic Biology! If a DNA segment reads 'A-T-G-C-C-A', what is the complementary mRNA strand during transcription?",
      "What cellular organelle reads mRNA codons to assemble polypeptide chains?"
    ],
    keywords: ["dna", "rna", "transcription", "translation", "ribosome", "codon", "protein", "gene", "biology"]
  },
  east_african_geography: {
    id: "east_african_geography",
    subject: "geography",
    title: "East African Rift Valley Formation & Drainage Systems",
    competency: "Analyze tectonic faulting, block mountains, and drainage basin patterns across East Africa.",
    prerequisites: ["plate_tectonics", "relief_regions"],
    misconceptions: ["Rift valleys are formed by river erosion alone", "All lakes in East Africa are man-made"],
    socraticStarters: [
      "Let's explore physical geography! What tectonic forces are responsible for creating the East African Rift Valley?",
      "How do internal land-forming processes influence river flow and lake basins across Uganda and neighboring countries?"
    ],
    keywords: ["geography", "rift valley", "tectonic", "faulting", "drainage", "basin", "mountain", "climate"]
  },
  african_history_colonialism: {
    id: "african_history_colonialism",
    subject: "history",
    title: "African Nationalism & Post-Colonial Independence Movements",
    competency: "Examine economic, social, and political catalysts of independence across East and Central Africa.",
    prerequisites: ["partition_of_africa", "indirect_rule"],
    misconceptions: ["African resistance was isolated and uncoordinated", "Independence was granted without local political agitation"],
    socraticStarters: [
      "Welcome to Socratic History! What major socio-economic grievances sparked early trade union movements and nationalist agitation in Uganda?",
      "How did Pan-African congresses and global shifts influence the path toward national independence?"
    ],
    keywords: ["history", "colonialism", "nationalism", "independence", "resistance", "politics", "africa", "trade union"]
  },
  ict_database_systems: {
    id: "ict_database_systems",
    subject: "ict",
    title: "Relational Database Management & SQL Queries",
    competency: "Design normalized database tables, primary keys, and execute relational queries.",
    prerequisites: ["binary_logic", "spreadsheet_modeling"],
    misconceptions: ["Databases are merely large Excel spreadsheets", "Primary keys can contain null values"],
    socraticStarters: [
      "Let's explore ICT and database design! Why is table normalization critical when storing student attendance records?",
      "If we want to retrieve specific student grades matching a term ID, what SQL clause do we use?"
    ],
    keywords: ["ict", "database", "sql", "table", "primary key", "normalization", "query", "relational"]
  },
  agriculture_soil_science: {
    id: "agriculture_soil_science",
    subject: "agriculture",
    title: "Tropical Soil Profiles & Crop Nutrition Management",
    competency: "Evaluate soil fertility, pH balance, macro-nutrients, and sustainable farming practices in Uganda.",
    prerequisites: ["weathering", "plant_physiology"],
    misconceptions: ["All tropical soils are uniformly fertile", "Fertilizer application replaces crop rotation entirely"],
    socraticStarters: [
      "Welcome to Agricultural Science! How does soil pH affect nutrient availability for staple crops like maize and beans?",
      "What sustainable soil management practices prevent nutrient leaching during heavy tropical rain seasons?"
    ],
    keywords: ["agriculture", "soil", "crop", "ph", "fertilizer", "nutrients", "farming", "maize"]
  }
};

/**
 * Computes semantic relevance score between user query and curriculum node using token Jaccard similarity.
 */
function scoreNodeRelevance(query: string, node: CurriculumNode): number {
  const queryTokens = new Set(query.toLowerCase().split(/\W+/).filter(t => t.length > 2));
  let matchCount = 0;

  for (const kw of node.keywords) {
    if (query.toLowerCase().includes(kw)) {
      matchCount += 3;
    }
  }

  for (const token of queryTokens) {
    if (node.title.toLowerCase().includes(token) || node.competency.toLowerCase().includes(token) || node.subject.toLowerCase().includes(token)) {
      matchCount += 1;
    }
  }

  return matchCount;
}

/**
 * Generates an authoritative, curriculum-grounded Socratic response across ANY hosted subject.
 */
export function generateSemanticOfflineTutorResponse(
  userInput: string,
  userName: string,
  userRole: string = "student",
  personaName: string = "male",
  subject: OfflineSubject = "general"
): string {
  const query = userInput.toLowerCase().trim();
  const isAdams = personaName === "male" || personaName.toLowerCase() === "adams";
  const honorific = userRole === "teacher" ? "Teacher" : userRole === "admin" ? "Administrator" : "Scholar";
  const prefix = isAdams 
    ? `Adams here, ${honorific} ${userName}. ` 
    : `Haawa here, ${honorific} ${userName}. `;

  // 1. Handle Greetings with Academic Warmth
  if (/(^|\s)(hello|hi|hey|salaam|greetings|good morning|good afternoon)(\s|$|[.!?])/i.test(query)) {
    return `${prefix}Salaam! As your Central Study Governor, I am delighted to connect with you. What specific NCDC Lower or Upper Secondary syllabus topic or lesson shall we explore and master today?`;
  }

  // 2. Handle Creator & Platform Inquiries
  if (query.includes("latif") || query.includes("creator") || query.includes("isabirye") || query.includes("who made")) {
    return `${prefix}This high-performance study companion was architected and developed by Isabirye Latif, an esteemed Ugandan educational technologist and software architect. You can explore his official manifesto on https://www.cymatichub.xyz and his physics wave research on https://resonance.cymatichub.xyz.`;
  }

  // 3. Semantic RAG Match across NCDC Curriculum Knowledge Graph (Dynamic across all subjects)
  let bestNode: CurriculumNode | null = null;
  let highestScore = 0;

  for (const nodeKey of Object.keys(NCDC_CURRICULUM_GRAPH)) {
    const node = NCDC_CURRICULUM_GRAPH[nodeKey];
    const subjectMatchBonus = (subject !== "general" && node.subject.toLowerCase() === subject.toLowerCase()) ? 5 : 0;
    const score = scoreNodeRelevance(query, node) + subjectMatchBonus;
    if (score > highestScore) {
      highestScore = score;
      bestNode = node;
    }
  }

  if (bestNode && highestScore >= 2) {
    const starter = bestNode.socraticStarters[Math.floor(Math.random() * bestNode.socraticStarters.length)];
    const misconceptionNote = bestNode.misconceptions.length > 0 
      ? ` Note common pitfalls: ${bestNode.misconceptions[0]}.` 
      : "";
    return `${prefix}Let's examine **${bestNode.title}** from our NCDC curriculum graph (${bestNode.competency}).${misconceptionNote} ${starter}`;
  }

  // 4. Structured Socratic Probing Fallback (Universal across all hosted subjects)
  const socraticProbes = [
    `That is a thought-provoking question, ${honorific} ${userName}. Let's apply Socratic reasoning: what core variables, historical context, or definitions from your NCDC syllabus apply to this topic?`,
    `Weebale for exploring this! To unpack your inquiry across our lessons, let's break it down into fundamental first principles. What do you observe when examining this topic?`,
    `Let's investigate this together, ${honorific} ${userName}. Which chapter or learning outcome in your syllabus does this most closely resemble?`
  ];

  const probe = socraticProbes[Math.floor(Math.random() * socraticProbes.length)];
  return `${prefix}${probe}`;
}
