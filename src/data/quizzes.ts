export interface QuizQuestion {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export const quizQuestions: QuizQuestion[] = [
  // ═══════════════════════════════════════
  // MATHEMATICS
  // ═══════════════════════════════════════

  // Math S1 - Number Systems (m1-1)
  {
    id: "q-m1-1a",
    topicId: "m1-1",
    question: "What is the LCM of 12 and 18?",
    options: ["6", "36", "72", "24"],
    correctIndex: 1,
    explanation: "12 = 2²×3, 18 = 2×3². LCM = 2²×3² = 36.",
  },
  {
    id: "q-m1-1b",
    topicId: "m1-1",
    question: "What is ¾ + ⅔?",
    options: ["7/12", "17/12", "5/7", "1"],
    correctIndex: 1,
    explanation: "¾ + ⅔ = 9/12 + 8/12 = 17/12.",
  },
  {
    id: "q-m1-1c",
    topicId: "m1-1",
    question: "Using BODMAS, evaluate: 3 + 4 × 2",
    options: ["14", "11", "10", "9"],
    correctIndex: 1,
    explanation: "Multiplication first: 4×2=8, then 3+8=11.",
  },
  {
    id: "q-m1-1d",
    topicId: "m1-1",
    question: "What is the HCF of 24 and 36?",
    options: ["6", "12", "18", "4"],
    correctIndex: 1,
    explanation: "24 = 2³×3, 36 = 2²×3². HCF = 2²×3 = 12.",
  },
  {
    id: "q-m1-1e",
    topicId: "m1-1",
    question: "Express 60 as a product of prime factors.",
    options: ["2×3×10", "2²×3×5", "4×15", "2×30"],
    correctIndex: 1,
    explanation: "60 = 2×30 = 2×2×15 = 2×2×3×5 = 2²×3×5.",
  },

  // Math S1 - Basic Algebra (m1-2)
  {
    id: "q-m1-2a",
    topicId: "m1-2",
    question: "Solve: 2x + 5 = 13",
    options: ["x = 3", "x = 4", "x = 9", "x = 6"],
    correctIndex: 1,
    explanation: "2x = 13 - 5 = 8, x = 4.",
  },
  {
    id: "q-m1-2b",
    topicId: "m1-2",
    question: "Simplify: 3a + 2b + 4a - b",
    options: ["7a + b", "7a + 3b", "7ab", "7a - b"],
    correctIndex: 0,
    explanation: "Combine like terms: (3a+4a)=7a, (2b-b)=b.",
  },
  {
    id: "q-m1-2c",
    topicId: "m1-2",
    question: "If y = 3, what is 2y² + 1?",
    options: ["19", "13", "7", "10"],
    correctIndex: 0,
    explanation: "2(3²)+1 = 2(9)+1 = 19.",
  },
  {
    id: "q-m1-2d",
    topicId: "m1-2",
    question: "Solve: 5x - 3 = 2x + 9",
    options: ["x = 2", "x = 4", "x = 3", "x = 6"],
    correctIndex: 1,
    explanation: "3x = 12, x = 4.",
  },
  {
    id: "q-m1-2e",
    topicId: "m1-2",
    question: "Expand: 3(2x + 5)",
    options: ["6x + 15", "6x + 5", "5x + 15", "6x + 8"],
    correctIndex: 0,
    explanation: "3×2x = 6x, 3×5 = 15.",
  },

  // Math S1 - Geometry Basics (m1-3)
  {
    id: "q-m1-3a",
    topicId: "m1-3",
    question: "What is the sum of angles in a triangle?",
    options: ["90°", "180°", "270°", "360°"],
    correctIndex: 1,
  },
  {
    id: "q-m1-3b",
    topicId: "m1-3",
    question: "An angle of 135° is called:",
    options: ["Acute", "Right", "Obtuse", "Reflex"],
    correctIndex: 2,
    explanation: "Obtuse angles are between 90° and 180°.",
  },
  {
    id: "q-m1-3c",
    topicId: "m1-3",
    question: "Vertically opposite angles are:",
    options: ["Supplementary", "Complementary", "Equal", "Right angles"],
    correctIndex: 2,
  },
  {
    id: "q-m1-3d",
    topicId: "m1-3",
    question: "Angles on a straight line add up to:",
    options: ["90°", "180°", "270°", "360°"],
    correctIndex: 1,
  },
  {
    id: "q-m1-3e",
    topicId: "m1-3",
    question: "All angles in an equilateral triangle are:",
    options: ["90°", "45°", "60°", "120°"],
    correctIndex: 2,
  },

  // Math S1 - Fractions, Decimals & Percentages (m1-4)
  {
    id: "q-m1-4a",
    topicId: "m1-4",
    question: "What is 25% of 240?",
    options: ["48", "60", "50", "72"],
    correctIndex: 1,
    explanation: "25/100 × 240 = 60.",
  },
  {
    id: "q-m1-4b",
    topicId: "m1-4",
    question: "Convert 0.375 to a fraction:",
    options: ["3/8", "3/7", "37/100", "5/8"],
    correctIndex: 0,
  },
  {
    id: "q-m1-4c",
    topicId: "m1-4",
    question: "A shirt costing UGX 20,000 is reduced by 10%. New price?",
    options: ["18,000", "19,000", "17,000", "16,000"],
    correctIndex: 0,
    explanation: "10% of 20,000 = 2,000. New = 18,000.",
  },
  {
    id: "q-m1-4d",
    topicId: "m1-4",
    question: "Convert ⅝ to a percentage:",
    options: ["60%", "62.5%", "65%", "58%"],
    correctIndex: 1,
  },

  // Math S1 - Ratio and Proportion (m1-5)
  {
    id: "q-m1-5a",
    topicId: "m1-5",
    question: "Share 120 in the ratio 3:5. What is the larger share?",
    options: ["45", "60", "75", "80"],
    correctIndex: 2,
    explanation: "Total parts = 8. Larger = 5/8 × 120 = 75.",
  },
  {
    id: "q-m1-5b",
    topicId: "m1-5",
    question: "Simplify the ratio 24:36:",
    options: ["4:6", "2:3", "8:12", "12:18"],
    correctIndex: 1,
    explanation: "Divide both by HCF (12): 2:3.",
  },
  {
    id: "q-m1-5c",
    topicId: "m1-5",
    question: "If 4 books cost UGX 12,000, how much do 7 books cost?",
    options: ["21,000", "18,000", "28,000", "24,000"],
    correctIndex: 0,
    explanation: "1 book = 3,000. 7 books = 21,000.",
  },

  // Math S1 - Area and Perimeter (m1-6)
  {
    id: "q-m1-6a",
    topicId: "m1-6",
    question: "Area of a circle with radius 7 cm (use π = 22/7):",
    options: ["44 cm²", "154 cm²", "22 cm²", "308 cm²"],
    correctIndex: 1,
    explanation: "πr² = 22/7 × 49 = 154 cm².",
  },
  {
    id: "q-m1-6b",
    topicId: "m1-6",
    question: "Perimeter of a rectangle 8 cm by 5 cm:",
    options: ["40 cm", "26 cm", "13 cm", "80 cm"],
    correctIndex: 1,
    explanation: "P = 2(8+5) = 26 cm.",
  },
  {
    id: "q-m1-6c",
    topicId: "m1-6",
    question: "Area of a triangle with base 10 cm and height 6 cm:",
    options: ["60 cm²", "30 cm²", "16 cm²", "20 cm²"],
    correctIndex: 1,
  },

  // Math S1 - Indices (m1-7)
  {
    id: "q-m1-7a",
    topicId: "m1-7",
    question: "Simplify: 2³ × 2⁴",
    options: ["2⁷", "2¹²", "4⁷", "2¹"],
    correctIndex: 0,
    explanation: "Same base: add indices. 2³⁺⁴ = 2⁷.",
  },
  {
    id: "q-m1-7b",
    topicId: "m1-7",
    question: "What is 5⁰?",
    options: ["0", "5", "1", "50"],
    correctIndex: 2,
    explanation: "Any number to the power 0 equals 1.",
  },
  {
    id: "q-m1-7c",
    topicId: "m1-7",
    question: "Express 0.00045 in standard form:",
    options: ["4.5 × 10⁻⁴", "45 × 10⁻⁵", "4.5 × 10⁴", "0.45 × 10⁻³"],
    correctIndex: 0,
  },

  // Math S2 - Pythagoras' Theorem (m2-1)
  {
    id: "q-m2-1a",
    topicId: "m2-1",
    question: "A right triangle has legs 3 and 4. What is the hypotenuse?",
    options: ["5", "6", "7", "25"],
    correctIndex: 0,
    explanation: "c = √(9+16) = √25 = 5.",
  },
  {
    id: "q-m2-1b",
    topicId: "m2-1",
    question: "Hypotenuse is 13, one leg is 5. Find the other leg.",
    options: ["8", "12", "10", "14"],
    correctIndex: 1,
    explanation: "a = √(169-25) = √144 = 12.",
  },
  {
    id: "q-m2-1c",
    topicId: "m2-1",
    question: "Which set is a Pythagorean triple?",
    options: ["(3,5,7)", "(5,12,13)", "(4,6,8)", "(2,3,4)"],
    correctIndex: 1,
  },
  {
    id: "q-m2-1d",
    topicId: "m2-1",
    question: "A ladder 10 m long leans against a wall, foot 6 m from base. Height reached?",
    options: ["4 m", "8 m", "6 m", "7 m"],
    correctIndex: 1,
    explanation: "h = √(100-36) = √64 = 8 m.",
  },

  // Math S2 - Trigonometry (m2-2)
  {
    id: "q-m2-2a",
    topicId: "m2-2",
    question: "In SOH CAH TOA, what does TOA stand for?",
    options: [
      "Tangent = Opposite / Adjacent",
      "Tangent = Adjacent / Opposite",
      "Tangent = Opposite / Hypotenuse",
      "Tan = Opposite × Adjacent",
    ],
    correctIndex: 0,
  },
  {
    id: "q-m2-2b",
    topicId: "m2-2",
    question: "sin 30° equals:",
    options: ["1", "√3/2", "1/2", "√2/2"],
    correctIndex: 2,
  },
  {
    id: "q-m2-2c",
    topicId: "m2-2",
    question: "cos 60° equals:",
    options: ["1", "√3/2", "1/2", "0"],
    correctIndex: 2,
  },
  {
    id: "q-m2-2d",
    topicId: "m2-2",
    question: "tan 45° equals:",
    options: ["0", "1", "√2", "undefined"],
    correctIndex: 1,
  },

  // Math S2 - Simultaneous Equations (m2-3)
  {
    id: "q-m2-3a",
    topicId: "m2-3",
    question: "Solve: x + y = 7 and x - y = 3",
    options: ["x=5, y=2", "x=4, y=3", "x=3, y=4", "x=6, y=1"],
    correctIndex: 0,
    explanation: "Add equations: 2x=10, x=5. Then y=2.",
  },
  {
    id: "q-m2-3b",
    topicId: "m2-3",
    question: "Solve: 2x + y = 8 and x + y = 5",
    options: ["x=3, y=2", "x=2, y=3", "x=4, y=1", "x=1, y=4"],
    correctIndex: 0,
    explanation: "Subtract: x = 3. y = 5-3 = 2.",
  },

  // Math S2 - Linear Graphs (m2-5)
  {
    id: "q-m2-5a",
    topicId: "m2-5",
    question: "What is the gradient of y = 3x - 7?",
    options: ["-7", "3", "7", "-3"],
    correctIndex: 1,
    explanation: "In y=mx+c, m is the gradient. m=3.",
  },
  {
    id: "q-m2-5b",
    topicId: "m2-5",
    question: "The y-intercept of y = 2x + 5 is:",
    options: ["2", "5", "-5", "0"],
    correctIndex: 1,
  },
  {
    id: "q-m2-5c",
    topicId: "m2-5",
    question: "Gradient of line through (1,3) and (4,9):",
    options: ["2", "3", "6", "1"],
    correctIndex: 0,
    explanation: "m = (9-3)/(4-1) = 6/3 = 2.",
  },

  // Math S2 - Sets (m2-7)
  {
    id: "q-m2-7a",
    topicId: "m2-7",
    question:
      "In a class of 40: 25 play football, 20 play netball, 10 play both. How many play neither?",
    options: ["5", "10", "15", "0"],
    correctIndex: 0,
    explanation: "n(F∪N) = 25+20-10 = 35. Neither = 40-35 = 5.",
  },
  {
    id: "q-m2-7b",
    topicId: "m2-7",
    question: "The symbol ∩ means:",
    options: ["Union", "Intersection", "Complement", "Subset"],
    correctIndex: 1,
  },

  // Math S2 - Inequalities (m2-6)
  {
    id: "q-m2-6a",
    topicId: "m2-6",
    question: "Solve: 3x - 2 > 7",
    options: ["x > 3", "x > 5", "x < 3", "x > 9"],
    correctIndex: 0,
    explanation: "3x > 9, x > 3.",
  },

  // Math S2 - Transformations (m2-8)
  {
    id: "q-m2-8a",
    topicId: "m2-8",
    question: "What is the image of (3, 2) after reflection in the x-axis?",
    options: ["(3, -2)", "(-3, 2)", "(-3, -2)", "(2, 3)"],
    correctIndex: 0,
  },

  // Math S3 - Quadratic Equations (m3-1)
  {
    id: "q-m3-1a",
    topicId: "m3-1",
    question: "Solve x² - 5x + 6 = 0",
    options: ["x=2, x=3", "x=-2, x=-3", "x=1, x=6", "x=-1, x=-6"],
    correctIndex: 0,
    explanation: "(x-2)(x-3)=0, so x=2 or x=3.",
  },
  {
    id: "q-m3-1b",
    topicId: "m3-1",
    question: "In the quadratic formula, what is the discriminant?",
    options: ["b² - 4ac", "2a", "-b", "4ac"],
    correctIndex: 0,
  },
  {
    id: "q-m3-1c",
    topicId: "m3-1",
    question: "If discriminant < 0, the equation has:",
    options: ["Two real roots", "One repeated root", "No real roots", "Three roots"],
    correctIndex: 2,
  },
  {
    id: "q-m3-1d",
    topicId: "m3-1",
    question: "Solve: x² - 9 = 0",
    options: ["x = ±3", "x = 9", "x = ±9", "x = 3"],
    correctIndex: 0,
  },

  // Math S3 - Circle Theorems (m3-2)
  {
    id: "q-m3-2a",
    topicId: "m3-2",
    question: "An angle at the centre is ___ the angle at the circumference.",
    options: ["Equal to", "Twice", "Half", "Three times"],
    correctIndex: 1,
  },
  {
    id: "q-m3-2b",
    topicId: "m3-2",
    question: "Angle in a semicircle is:",
    options: ["45°", "60°", "90°", "180°"],
    correctIndex: 2,
  },
  {
    id: "q-m3-2c",
    topicId: "m3-2",
    question: "Opposite angles of a cyclic quadrilateral sum to:",
    options: ["90°", "180°", "270°", "360°"],
    correctIndex: 1,
  },

  // Math S3 - Sequences (m3-3)
  {
    id: "q-m3-3a",
    topicId: "m3-3",
    question: "Find the 10th term of AP: 3, 7, 11, 15, …",
    options: ["39", "43", "35", "41"],
    correctIndex: 0,
    explanation: "a=3, d=4. a₁₀ = 3 + 9(4) = 39.",
  },
  {
    id: "q-m3-3b",
    topicId: "m3-3",
    question: "In a GP with a=2, r=3, find the 4th term.",
    options: ["54", "18", "162", "24"],
    correctIndex: 0,
    explanation: "a₄ = 2×3³ = 54.",
  },

  // Math S3 - Trig Identities (m3-4)
  {
    id: "q-m3-4a",
    topicId: "m3-4",
    question: "Using sine rule, if a/sin A = 10 and sin B = 0.5, find b:",
    options: ["5", "10", "20", "2.5"],
    correctIndex: 0,
  },
  {
    id: "q-m3-4b",
    topicId: "m3-4",
    question: "Area of triangle with sides 8 and 6, included angle 60°:",
    options: ["24√3", "12√3", "48", "24"],
    correctIndex: 1,
    explanation: "½×8×6×sin60° = 24×(√3/2) = 12√3.",
  },

  // Math S3 - Variation (m3-5)
  {
    id: "q-m3-5a",
    topicId: "m3-5",
    question: "If y varies directly as x and y=12 when x=4, find y when x=7:",
    options: ["21", "28", "16", "9"],
    correctIndex: 0,
    explanation: "k=12/4=3. y=3×7=21.",
  },

  // Math S3 - Logarithms (m3-6)
  {
    id: "q-m3-6a",
    topicId: "m3-6",
    question: "log₂ 8 = ?",
    options: ["2", "3", "4", "8"],
    correctIndex: 1,
    explanation: "2³ = 8, so log₂ 8 = 3.",
  },
  {
    id: "q-m3-6b",
    topicId: "m3-6",
    question: "Simplify: log 20 + log 5",
    options: ["log 25", "log 100", "log 15", "log 4"],
    correctIndex: 1,
    explanation: "log(20×5) = log 100 = 2.",
  },

  // Math S4 - Matrices (m4-1)
  {
    id: "q-m4-1a",
    topicId: "m4-1",
    question: "The determinant of [3 1; 2 4] is:",
    options: ["10", "14", "5", "11"],
    correctIndex: 0,
    explanation: "det = 3×4 - 1×2 = 10.",
  },
  {
    id: "q-m4-1b",
    topicId: "m4-1",
    question: "A matrix with determinant 0 is called:",
    options: ["Identity", "Singular", "Inverse", "Diagonal"],
    correctIndex: 1,
  },

  // Math S4 - Statistics (m4-2)
  {
    id: "q-m4-2a",
    topicId: "m4-2",
    question: "A 2×3 matrix multiplied by a 3×2 matrix gives:",
    options: ["2×2 matrix", "3×3 matrix", "2×3 matrix", "Not possible"],
    correctIndex: 0,
  },
  {
    id: "q-m4-2b",
    topicId: "m4-2",
    question: "The probability of getting a head when tossing a fair coin:",
    options: ["1", "0.5", "0.25", "0"],
    correctIndex: 1,
  },
  {
    id: "q-m4-2c",
    topicId: "m4-2",
    question: "Mean of 4, 8, 6, 10, 12:",
    options: ["8", "10", "6", "7"],
    correctIndex: 0,
    explanation: "Sum=40, n=5, mean=8.",
  },

  // Math S4 - Vectors (m4-3)
  {
    id: "q-m4-3a",
    topicId: "m4-3",
    question: "The magnitude of vector (3, 4) is:",
    options: ["5", "7", "12", "25"],
    correctIndex: 0,
    explanation: "|v| = √(9+16) = 5.",
  },

  // Math S4 - Calculus Differentiation (m4-4)
  {
    id: "q-m4-4a",
    topicId: "m4-4",
    question: "Differentiate y = x³",
    options: ["3x²", "x⁴/4", "3x", "x²"],
    correctIndex: 0,
  },
  {
    id: "q-m4-4b",
    topicId: "m4-4",
    question: "dy/dx of y = 5x² + 3x - 7 is:",
    options: ["10x + 3", "5x + 3", "10x - 7", "10x² + 3"],
    correctIndex: 0,
  },
  {
    id: "q-m4-4c",
    topicId: "m4-4",
    question: "At stationary points, dy/dx equals:",
    options: ["1", "-1", "0", "undefined"],
    correctIndex: 2,
  },

  // Math S4 - Integration (m4-5)
  {
    id: "q-m4-5a",
    topicId: "m4-5",
    question: "∫2x dx = ?",
    options: ["x²+C", "2x²+C", "x+C", "2+C"],
    correctIndex: 0,
  },
  {
    id: "q-m4-5b",
    topicId: "m4-5",
    question: "∫3x² dx = ?",
    options: ["x³+C", "6x+C", "x³/3+C", "3x³+C"],
    correctIndex: 0,
  },

  // Math S4 - Linear Programming (m4-6)
  {
    id: "q-m4-6a",
    topicId: "m4-6",
    question: "In linear programming, the feasible region is:",
    options: [
      "Where all constraints are satisfied",
      "The largest region",
      "Outside all lines",
      "A single point",
    ],
    correctIndex: 0,
  },

  // ═══════════════════════════════════════
  // PHYSICS
  // ═══════════════════════════════════════

  // Physics S1 - Measurement (p1-1)
  {
    id: "q-p1-1a",
    topicId: "p1-1",
    question: "What is the SI unit of length?",
    options: ["Centimetre", "Metre", "Kilometre", "Foot"],
    correctIndex: 1,
  },
  {
    id: "q-p1-1b",
    topicId: "p1-1",
    question: "Which instrument measures very small lengths (±0.01 mm)?",
    options: ["Metre rule", "Tape measure", "Vernier calipers", "Micrometer screw gauge"],
    correctIndex: 3,
  },
  {
    id: "q-p1-1c",
    topicId: "p1-1",
    question: "The formula for density is:",
    options: ["Mass × Volume", "Mass / Volume", "Volume / Mass", "Weight / Volume"],
    correctIndex: 1,
  },
  {
    id: "q-p1-1d",
    topicId: "p1-1",
    question: "Density of water is:",
    options: ["100 kg/m³", "1,000 kg/m³", "10,000 kg/m³", "10 kg/m³"],
    correctIndex: 1,
  },
  {
    id: "q-p1-1e",
    topicId: "p1-1",
    question: "How many cm³ in 1 litre?",
    options: ["10", "100", "1,000", "10,000"],
    correctIndex: 2,
  },

  // Physics S1 - States of Matter (p1-2)
  {
    id: "q-p1-2a",
    topicId: "p1-2",
    question: "In which state do particles vibrate in fixed positions?",
    options: ["Solid", "Liquid", "Gas", "Plasma"],
    correctIndex: 0,
  },
  {
    id: "q-p1-2b",
    topicId: "p1-2",
    question: "Brownian motion provides evidence for:",
    options: ["Gravity", "Kinetic theory", "Magnetism", "Electricity"],
    correctIndex: 1,
  },
  {
    id: "q-p1-2c",
    topicId: "p1-2",
    question: "Diffusion is fastest in:",
    options: ["Solids", "Liquids", "Gases", "All the same"],
    correctIndex: 2,
  },
  {
    id: "q-p1-2d",
    topicId: "p1-2",
    question: "The change from liquid to gas is called:",
    options: ["Melting", "Freezing", "Evaporation/Boiling", "Condensation"],
    correctIndex: 2,
  },
  {
    id: "q-p1-2e",
    topicId: "p1-2",
    question: "Sublimation is:",
    options: ["Solid → Liquid", "Liquid → Gas", "Solid → Gas directly", "Gas → Liquid"],
    correctIndex: 2,
  },

  // Physics S1 - Forces (p1-3)
  {
    id: "q-p1-3a",
    topicId: "p1-3",
    question: "The SI unit of force is:",
    options: ["Kilogram", "Newton", "Joule", "Pascal"],
    correctIndex: 1,
  },
  {
    id: "q-p1-3b",
    topicId: "p1-3",
    question: "Weight = mass × ___",
    options: ["velocity", "density", "gravity", "volume"],
    correctIndex: 2,
  },
  {
    id: "q-p1-3c",
    topicId: "p1-3",
    question: "Hooke's Law states extension is proportional to:",
    options: ["Mass", "Weight", "Applied force", "Volume"],
    correctIndex: 2,
  },
  {
    id: "q-p1-3d",
    topicId: "p1-3",
    question: "Pressure = Force / ___",
    options: ["Volume", "Mass", "Area", "Time"],
    correctIndex: 2,
  },
  {
    id: "q-p1-3e",
    topicId: "p1-3",
    question: "An astronaut weighs 900 N on Earth (g=10). Their mass is:",
    options: ["9 kg", "90 kg", "900 kg", "9000 kg"],
    correctIndex: 1,
  },

  // Physics S1 - Energy (p1-4)
  {
    id: "q-p1-4a",
    topicId: "p1-4",
    question: "KE = ?",
    options: ["mgh", "½mv²", "Fd", "Pt"],
    correctIndex: 1,
  },
  {
    id: "q-p1-4b",
    topicId: "p1-4",
    question: "Which is a renewable energy source?",
    options: ["Coal", "Natural gas", "Solar", "Oil"],
    correctIndex: 2,
  },
  {
    id: "q-p1-4c",
    topicId: "p1-4",
    question: "Power = Energy / ___",
    options: ["Mass", "Distance", "Time", "Force"],
    correctIndex: 2,
  },
  {
    id: "q-p1-4d",
    topicId: "p1-4",
    question: "A 50 kg person climbs 4 m in 10 s. Power = ?",
    options: ["200 W", "500 W", "2000 W", "100 W"],
    correctIndex: 0,
    explanation: "W=mgh=50×10×4=2000J. P=2000/10=200W.",
  },

  // Physics S2 - Forces & Motion (p2-1)
  {
    id: "q-p2-1a",
    topicId: "p2-1",
    question: "Speed = ?",
    options: ["Distance × Time", "Distance / Time", "Time / Distance", "Distance + Time"],
    correctIndex: 1,
  },
  {
    id: "q-p2-1b",
    topicId: "p2-1",
    question: "What is the unit of acceleration?",
    options: ["m/s", "m/s²", "km/h", "m²/s"],
    correctIndex: 1,
  },
  {
    id: "q-p2-1c",
    topicId: "p2-1",
    question: "Newton's 1st law is about:",
    options: ["F=ma", "Action-reaction", "Inertia", "Gravity"],
    correctIndex: 2,
  },
  {
    id: "q-p2-1d",
    topicId: "p2-1",
    question: "F = ma. If m=5kg, a=3m/s², F=?",
    options: ["15 N", "8 N", "2 N", "1.67 N"],
    correctIndex: 0,
  },
  {
    id: "q-p2-1e",
    topicId: "p2-1",
    question: "Momentum p = ?",
    options: ["m/v", "mv", "m+v", "v/m"],
    correctIndex: 1,
  },

  // Physics S2 - Turning Effects (p2-2)
  {
    id: "q-p2-2a",
    topicId: "p2-2",
    question: "Moment = Force × ___",
    options: ["Mass", "Perpendicular distance", "Acceleration", "Velocity"],
    correctIndex: 1,
  },
  {
    id: "q-p2-2b",
    topicId: "p2-2",
    question: "For equilibrium: sum of clockwise moments equals:",
    options: ["Zero", "Sum of anticlockwise moments", "Total force", "Weight"],
    correctIndex: 1,
  },
  {
    id: "q-p2-2c",
    topicId: "p2-2",
    question: "An object is most stable when it has:",
    options: [
      "High CG, narrow base",
      "Low CG, wide base",
      "High CG, wide base",
      "Low CG, narrow base",
    ],
    correctIndex: 1,
  },

  // Physics S2 - Pressure (p2-3)
  {
    id: "q-p2-3a",
    topicId: "p2-3",
    question: "Liquid pressure formula: P = ?",
    options: ["F/A", "ρgh", "mv", "IR"],
    correctIndex: 1,
  },
  {
    id: "q-p2-3b",
    topicId: "p2-3",
    question: "Boyle's Law: At constant temperature, P₁V₁ = ?",
    options: ["P₂/V₂", "P₂V₂", "P₂+V₂", "P₂-V₂"],
    correctIndex: 1,
  },
  {
    id: "q-p2-3c",
    topicId: "p2-3",
    question: "Atmospheric pressure at sea level is approximately:",
    options: ["100 Pa", "1,000 Pa", "10,000 Pa", "100,000 Pa"],
    correctIndex: 3,
  },
  {
    id: "q-p2-3d",
    topicId: "p2-3",
    question: "A diver at 25 m depth in water (ρ=1000, g=10). Water pressure?",
    options: ["25,000 Pa", "250,000 Pa", "2,500 Pa", "250 Pa"],
    correctIndex: 1,
  },

  // Physics S2 - Work, Energy, Power (p2-4)
  {
    id: "q-p2-4a",
    topicId: "p2-4",
    question: "Work = Force × ___",
    options: ["Time", "Mass", "Distance", "Speed"],
    correctIndex: 2,
  },
  {
    id: "q-p2-4b",
    topicId: "p2-4",
    question: "Mechanical advantage = Load / ___",
    options: ["Work", "Effort", "Distance", "Velocity"],
    correctIndex: 1,
  },
  {
    id: "q-p2-4c",
    topicId: "p2-4",
    question: "Efficiency = (MA/VR) × ?",
    options: ["10%", "50%", "100%", "200%"],
    correctIndex: 2,
  },

  // Physics S3 - Electricity (p3-1)
  {
    id: "q-p3-1a",
    topicId: "p3-1",
    question: "Ohm's Law: V = ?",
    options: ["I/R", "IR", "R/I", "I+R"],
    correctIndex: 1,
  },
  {
    id: "q-p3-1b",
    topicId: "p3-1",
    question: "Resistance is measured in:",
    options: ["Amps", "Volts", "Ohms", "Watts"],
    correctIndex: 2,
  },
  {
    id: "q-p3-1c",
    topicId: "p3-1",
    question: "In a series circuit, the current is:",
    options: ["Different everywhere", "Same throughout", "Zero", "Maximum at battery"],
    correctIndex: 1,
  },
  {
    id: "q-p3-1d",
    topicId: "p3-1",
    question: "P = IV. If I=2A, V=12V, P=?",
    options: ["6 W", "14 W", "24 W", "10 W"],
    correctIndex: 2,
  },
  {
    id: "q-p3-1e",
    topicId: "p3-1",
    question: "A 100 W bulb runs for 10 hours. Energy in kWh?",
    options: ["1 kWh", "10 kWh", "100 kWh", "0.1 kWh"],
    correctIndex: 0,
    explanation: "0.1 kW × 10 h = 1 kWh.",
  },

  // Physics S3 - Magnetism (p3-2)
  {
    id: "q-p3-2a",
    topicId: "p3-2",
    question: "Like magnetic poles:",
    options: ["Attract", "Repel", "Have no effect", "Combine"],
    correctIndex: 1,
  },
  {
    id: "q-p3-2b",
    topicId: "p3-2",
    question: "An electromagnet uses:",
    options: ["Permanent magnets", "Current-carrying coil", "Static electricity", "Gravity"],
    correctIndex: 1,
  },
  {
    id: "q-p3-2c",
    topicId: "p3-2",
    question: "A step-down transformer:",
    options: ["Increases voltage", "Decreases voltage", "Increases current only", "Has no effect"],
    correctIndex: 1,
  },
  {
    id: "q-p3-2d",
    topicId: "p3-2",
    question: "Transformer ratio: Vs/Vp = ?",
    options: ["Np/Ns", "Ns/Np", "Ip/Is", "Is×Ip"],
    correctIndex: 1,
  },

  // Physics S3 - Thermal Physics (p3-3)
  {
    id: "q-p3-3a",
    topicId: "p3-3",
    question: "Heat energy formula: Q = ?",
    options: ["mcΔθ", "mv²", "Fd", "IR"],
    correctIndex: 0,
  },
  {
    id: "q-p3-3b",
    topicId: "p3-3",
    question: "Which transfers heat through a vacuum?",
    options: ["Conduction", "Convection", "Radiation", "All three"],
    correctIndex: 2,
  },
  {
    id: "q-p3-3c",
    topicId: "p3-3",
    question: "Specific heat capacity of water is:",
    options: ["420 J/kg°C", "4,200 J/kg°C", "42 J/kg°C", "42,000 J/kg°C"],
    correctIndex: 1,
  },
  {
    id: "q-p3-3d",
    topicId: "p3-3",
    question: "Energy to heat 3 kg of water by 20°C (c=4200)?",
    options: ["252,000 J", "25,200 J", "126,000 J", "84,000 J"],
    correctIndex: 0,
  },

  // Physics S3 - Light (p3-4)
  {
    id: "q-p3-4a",
    topicId: "p3-4",
    question: "Snell's Law: n₁ sin i = ?",
    options: ["n₂ cos r", "n₂ sin r", "n₁ cos i", "n₂ tan r"],
    correctIndex: 1,
  },
  {
    id: "q-p3-4b",
    topicId: "p3-4",
    question: "Total internal reflection occurs when angle > :",
    options: ["Normal angle", "Critical angle", "45°", "90°"],
    correctIndex: 1,
  },
  {
    id: "q-p3-4c",
    topicId: "p3-4",
    question: "The lens formula is:",
    options: ["1/f = 1/u + 1/v", "f = u + v", "f = uv", "1/f = u - v"],
    correctIndex: 0,
  },

  // Physics S4 - Waves & Sound (p4-1)
  {
    id: "q-p4-1a",
    topicId: "p4-1",
    question: "Wave speed: v = ?",
    options: ["f/λ", "fλ", "λ/f", "f+λ"],
    correctIndex: 1,
  },
  {
    id: "q-p4-1b",
    topicId: "p4-1",
    question: "Speed of sound in air is approximately:",
    options: ["3×10⁸ m/s", "340 m/s", "1,500 m/s", "34 m/s"],
    correctIndex: 1,
  },
  {
    id: "q-p4-1c",
    topicId: "p4-1",
    question: "Sound is a ___ wave:",
    options: ["Transverse", "Longitudinal", "Electromagnetic", "Surface"],
    correctIndex: 1,
  },
  {
    id: "q-p4-1d",
    topicId: "p4-1",
    question: "Frequency = 500 Hz, wavelength = 0.68 m. Speed?",
    options: ["340 m/s", "735 m/s", "170 m/s", "250 m/s"],
    correctIndex: 0,
  },

  // Physics S4 - EM Spectrum (p4-2)
  {
    id: "q-p4-2a",
    topicId: "p4-2",
    question: "Speed of all EM waves is:",
    options: ["340 m/s", "3×10⁶ m/s", "3×10⁸ m/s", "Variable"],
    correctIndex: 2,
  },
  {
    id: "q-p4-2b",
    topicId: "p4-2",
    question: "Which EM wave is used in hospitals for imaging?",
    options: ["Radio", "Microwave", "X-ray", "Infrared"],
    correctIndex: 2,
  },
  {
    id: "q-p4-2c",
    topicId: "p4-2",
    question: "The correct order from longest to shortest wavelength:",
    options: [
      "Radio, Micro, IR, Visible, UV, X-ray, Gamma",
      "Gamma, X-ray, UV, Visible, IR, Micro, Radio",
      "Visible, UV, IR, Radio, Gamma, X-ray, Micro",
      "Radio, Gamma, Visible, UV, IR, X-ray, Micro",
    ],
    correctIndex: 0,
  },

  // Physics S4 - Nuclear Physics (p4-3)
  {
    id: "q-p4-3a",
    topicId: "p4-3",
    question: "Alpha particles are:",
    options: ["Electrons", "Helium nuclei", "EM waves", "Neutrons"],
    correctIndex: 1,
  },
  {
    id: "q-p4-3b",
    topicId: "p4-3",
    question: "Half-life is:",
    options: [
      "Time for all atoms to decay",
      "Time for half to decay",
      "Time for radiation to stop",
      "Half the sample's mass",
    ],
    correctIndex: 1,
  },
  {
    id: "q-p4-3c",
    topicId: "p4-3",
    question: "Which radiation is stopped by paper?",
    options: ["Alpha", "Beta", "Gamma", "None"],
    correctIndex: 0,
  },
  {
    id: "q-p4-3d",
    topicId: "p4-3",
    question: "After 3 half-lives, the fraction remaining is:",
    options: ["1/2", "1/4", "1/8", "1/16"],
    correctIndex: 2,
  },

  // Physics S4 - Electronics (p4-4)
  {
    id: "q-p4-4a",
    topicId: "p4-4",
    question: "A diode allows current in ___ direction(s):",
    options: ["One", "Two", "All", "None"],
    correctIndex: 0,
  },
  {
    id: "q-p4-4b",
    topicId: "p4-4",
    question: "An AND gate gives output 1 only when:",
    options: ["Any input is 1", "All inputs are 1", "No inputs are 1", "Inputs differ"],
    correctIndex: 1,
  },

  // ═══════════════════════════════════════
  // CHEMISTRY
  // ═══════════════════════════════════════

  // Chemistry S1 - Intro (c1-1)
  {
    id: "q-c1-1a",
    topicId: "c1-1",
    question: "Which is NOT a state of matter?",
    options: ["Solid", "Liquid", "Gas", "Energy"],
    correctIndex: 3,
  },
  {
    id: "q-c1-1b",
    topicId: "c1-1",
    question: "What happens to particles when heated?",
    options: ["Move slower", "Move faster", "Stop moving", "Shrink"],
    correctIndex: 1,
  },
  {
    id: "q-c1-1c",
    topicId: "c1-1",
    question: "Filtration separates:",
    options: ["Miscible liquids", "Insoluble solid from liquid", "Dissolved salt", "Gases"],
    correctIndex: 1,
  },
  {
    id: "q-c1-1d",
    topicId: "c1-1",
    question: "The non-luminous Bunsen flame is:",
    options: ["Yellow and sooty", "Blue and hotter", "Red and cool", "Invisible"],
    correctIndex: 1,
  },
  {
    id: "q-c1-1e",
    topicId: "c1-1",
    question: "Brass is an alloy of:",
    options: ["Iron + carbon", "Copper + zinc", "Copper + tin", "Lead + tin"],
    correctIndex: 1,
  },

  // Chemistry S1 - Acids & Bases (c1-2)
  {
    id: "q-c1-2a",
    topicId: "c1-2",
    question: "Acids have pH:",
    options: ["Above 7", "Equal to 7", "Below 7", "Equal to 14"],
    correctIndex: 2,
  },
  {
    id: "q-c1-2b",
    topicId: "c1-2",
    question: "Acid + Base → ?",
    options: ["Salt + Water", "Acid + Metal", "Gas only", "Nothing"],
    correctIndex: 0,
  },
  {
    id: "q-c1-2c",
    topicId: "c1-2",
    question: "Universal indicator is green at pH:",
    options: ["1", "7", "14", "3"],
    correctIndex: 1,
  },
  {
    id: "q-c1-2d",
    topicId: "c1-2",
    question: "HCl reacts with NaOH to form:",
    options: ["NaCl + H₂O", "NaH + ClO", "Na + HClO", "NaCl₂ + H₂"],
    correctIndex: 0,
  },
  {
    id: "q-c1-2e",
    topicId: "c1-2",
    question: "Sulphuric acid produces ___ salts:",
    options: ["Chloride", "Nitrate", "Sulphate", "Carbonate"],
    correctIndex: 2,
  },

  // Chemistry S1 - Water & Hydrogen (c1-3)
  {
    id: "q-c1-3a",
    topicId: "c1-3",
    question: "Test for water: anhydrous CuSO₄ turns:",
    options: ["Pink to blue", "White to blue", "Blue to white", "Clear to milky"],
    correctIndex: 1,
  },
  {
    id: "q-c1-3b",
    topicId: "c1-3",
    question: "Hydrogen burns with a:",
    options: ["Green flame", "Pop sound", "Smoky flame", "Silent flame"],
    correctIndex: 1,
  },
  {
    id: "q-c1-3c",
    topicId: "c1-3",
    question: "Hard water does not lather easily because it contains:",
    options: ["Salt", "Dissolved Ca²⁺/Mg²⁺", "Chlorine", "Acid"],
    correctIndex: 1,
  },

  // Chemistry S1 - Air & Combustion (c1-4)
  {
    id: "q-c1-4a",
    topicId: "c1-4",
    question: "The percentage of oxygen in air is about:",
    options: ["78%", "21%", "1%", "0.03%"],
    correctIndex: 1,
  },
  {
    id: "q-c1-4b",
    topicId: "c1-4",
    question: "Test for oxygen: it ___ a glowing splint.",
    options: ["Extinguishes", "Relights", "Pops", "Turns blue"],
    correctIndex: 1,
  },
  {
    id: "q-c1-4c",
    topicId: "c1-4",
    question: "CO₂ turns lime water:",
    options: ["Blue", "Red", "Milky", "Green"],
    correctIndex: 2,
  },
  {
    id: "q-c1-4d",
    topicId: "c1-4",
    question: "Rusting requires iron, ___ and ___.",
    options: ["Light, heat", "Oxygen, water", "Acid, salt", "CO₂, heat"],
    correctIndex: 1,
  },
  {
    id: "q-c1-4e",
    topicId: "c1-4",
    question: "The fire triangle includes fuel, heat, and:",
    options: ["Water", "Carbon dioxide", "Oxygen", "Nitrogen"],
    correctIndex: 2,
  },

  // Chemistry S2 - Atomic Structure (c2-1)
  {
    id: "q-c2-1a",
    topicId: "c2-1",
    question: "The atomic number tells us the number of:",
    options: ["Neutrons", "Protons", "Electrons and neutrons", "Mass"],
    correctIndex: 1,
  },
  {
    id: "q-c2-1b",
    topicId: "c2-1",
    question: "How many electrons in the first shell?",
    options: ["1", "2", "8", "18"],
    correctIndex: 1,
  },
  {
    id: "q-c2-1c",
    topicId: "c2-1",
    question: "Isotopes have same ___ but different ___:",
    options: [
      "Mass number, atomic number",
      "Atomic number, mass number",
      "Electrons, protons",
      "Neutrons, electrons",
    ],
    correctIndex: 1,
  },
  {
    id: "q-c2-1d",
    topicId: "c2-1",
    question: "Electron configuration of sodium (11) is:",
    options: ["2, 9", "2, 8, 1", "2, 8, 2", "11"],
    correctIndex: 1,
  },
  {
    id: "q-c2-1e",
    topicId: "c2-1",
    question: "Metals form ___ ions:",
    options: ["Negative", "Positive", "Neutral", "No ions"],
    correctIndex: 1,
  },

  // Chemistry S2 - Periodic Table (c2-2)
  {
    id: "q-c2-2a",
    topicId: "c2-2",
    question: "Group I metals are called:",
    options: ["Halogens", "Noble gases", "Alkali metals", "Transition metals"],
    correctIndex: 2,
  },
  {
    id: "q-c2-2b",
    topicId: "c2-2",
    question: "Reactivity of Group VII ___ down the group:",
    options: ["Increases", "Decreases", "Stays same", "Alternates"],
    correctIndex: 1,
  },
  {
    id: "q-c2-2c",
    topicId: "c2-2",
    question: "Noble gases are unreactive because:",
    options: ["They are heavy", "Full outer electron shell", "They are light", "No electrons"],
    correctIndex: 1,
  },
  {
    id: "q-c2-2d",
    topicId: "c2-2",
    question: "Chlorine displaces bromine because chlorine is:",
    options: ["Less reactive", "More reactive", "Heavier", "A gas"],
    correctIndex: 1,
  },

  // Chemistry S2 - Reactions (c2-3)
  {
    id: "q-c2-3a",
    topicId: "c2-3",
    question: "In a displacement reaction, a more reactive metal:",
    options: ["Dissolves", "Replaces a less reactive metal", "Melts", "Explodes"],
    correctIndex: 1,
  },
  {
    id: "q-c2-3b",
    topicId: "c2-3",
    question: "An exothermic reaction:",
    options: ["Absorbs heat", "Releases heat", "Needs light", "Produces gas only"],
    correctIndex: 1,
  },
  {
    id: "q-c2-3c",
    topicId: "c2-3",
    question: "Balance: _Fe + _O₂ → _Fe₂O₃",
    options: ["4, 3, 2", "2, 3, 1", "2, 1, 1", "1, 1, 1"],
    correctIndex: 0,
  },

  // Chemistry S2 - Metals (c2-4)
  {
    id: "q-c2-4a",
    topicId: "c2-4",
    question: "The most reactive metal in the reactivity series is:",
    options: ["Iron", "Copper", "Potassium", "Zinc"],
    correctIndex: 2,
  },
  {
    id: "q-c2-4b",
    topicId: "c2-4",
    question: "Zinc + CuSO₄ → ?",
    options: ["Nothing happens", "ZnSO₄ + Cu", "CuZn + SO₄", "ZnCu + SO₄"],
    correctIndex: 1,
  },
  {
    id: "q-c2-4c",
    topicId: "c2-4",
    question: "Very reactive metals (K, Na) are extracted by:",
    options: ["Heating with carbon", "Electrolysis", "Displacement", "Filtering"],
    correctIndex: 1,
  },
  {
    id: "q-c2-4d",
    topicId: "c2-4",
    question: "The only liquid metal at room temperature is:",
    options: ["Iron", "Sodium", "Mercury", "Copper"],
    correctIndex: 2,
  },

  // Chemistry S3 - Bonding (c3-1)
  {
    id: "q-c3-1a",
    topicId: "c3-1",
    question: "Ionic bonding involves:",
    options: ["Sharing electrons", "Transferring electrons", "Sharing protons", "No electrons"],
    correctIndex: 1,
  },
  {
    id: "q-c3-1b",
    topicId: "c3-1",
    question: "Covalent bonds form between:",
    options: ["Two metals", "Two non-metals", "Metal and non-metal", "Noble gases"],
    correctIndex: 1,
  },
  {
    id: "q-c3-1c",
    topicId: "c3-1",
    question: "Metallic bonding involves:",
    options: [
      "Shared ion pairs",
      "Sea of delocalised electrons",
      "Transferred protons",
      "Van der Waals forces only",
    ],
    correctIndex: 1,
  },
  {
    id: "q-c3-1d",
    topicId: "c3-1",
    question: "Ionic compounds have ___ melting points:",
    options: ["Very low", "Low", "High", "Zero"],
    correctIndex: 2,
  },

  // Chemistry S3 - Moles (c3-2)
  {
    id: "q-c3-2a",
    topicId: "c3-2",
    question: "Moles = ?",
    options: ["Mass × Mr", "Mass / Mr", "Mr / Mass", "Mass + Mr"],
    correctIndex: 1,
    explanation: "n = mass / molar mass.",
  },
  {
    id: "q-c3-2b",
    topicId: "c3-2",
    question: "Avogadro's number is:",
    options: ["6.02 × 10²³", "3.14 × 10²³", "6.02 × 10⁶", "1.6 × 10⁻¹⁹"],
    correctIndex: 0,
  },
  {
    id: "q-c3-2c",
    topicId: "c3-2",
    question: "1 mole of gas at RTP occupies:",
    options: ["22.4 dm³", "24 dm³", "12 dm³", "48 dm³"],
    correctIndex: 1,
  },
  {
    id: "q-c3-2d",
    topicId: "c3-2",
    question: "Number of moles in 88 g of CO₂ (Mr=44):",
    options: ["0.5", "1", "2", "4"],
    correctIndex: 2,
  },

  // Chemistry S3 - Salts (c3-3)
  {
    id: "q-c3-3a",
    topicId: "c3-3",
    question: "Acid + Carbonate → Salt + Water + ?",
    options: ["Hydrogen", "Oxygen", "Carbon dioxide", "Nitrogen"],
    correctIndex: 2,
  },
  {
    id: "q-c3-3b",
    topicId: "c3-3",
    question: "Insoluble salts are prepared by:",
    options: ["Evaporation", "Titration", "Precipitation", "Distillation"],
    correctIndex: 2,
  },
  {
    id: "q-c3-3c",
    topicId: "c3-3",
    question: "HNO₃ produces ___ salts:",
    options: ["Chloride", "Sulphate", "Nitrate", "Carbonate"],
    correctIndex: 2,
  },

  // Chemistry S3 - Electrolysis (c3-4)
  {
    id: "q-c3-4a",
    topicId: "c3-4",
    question: "At the cathode, ___ ions gain electrons:",
    options: ["Negative", "Positive", "Neutral", "Both"],
    correctIndex: 1,
  },
  {
    id: "q-c3-4b",
    topicId: "c3-4",
    question: "OILRIG stands for:",
    options: [
      "Oxidation Is Loss, Reduction Is Gain",
      "Oxygen In Liquid, Reduction In Gas",
      "Only Iron Loses, Rest Is Gold",
      "Oxidation Increases Load, Reduction Is Great",
    ],
    correctIndex: 0,
  },
  {
    id: "q-c3-4c",
    topicId: "c3-4",
    question: "During electrolysis of molten NaCl, at the anode:",
    options: ["Sodium forms", "Chlorine gas forms", "Hydrogen forms", "Water forms"],
    correctIndex: 1,
  },
  {
    id: "q-c3-4d",
    topicId: "c3-4",
    question: "Electroplating uses the object to be plated as the:",
    options: ["Anode", "Cathode", "Electrolyte", "Switch"],
    correctIndex: 1,
  },

  // Chemistry S4 - Organic (c4-1)
  {
    id: "q-c4-1a",
    topicId: "c4-1",
    question: "Methane (CH₄) is an example of:",
    options: ["Alkene", "Alkane", "Alkyne", "Alcohol"],
    correctIndex: 1,
  },
  {
    id: "q-c4-1b",
    topicId: "c4-1",
    question: "The functional group -OH belongs to:",
    options: ["Alkanes", "Carboxylic acids", "Alcohols", "Esters"],
    correctIndex: 2,
  },
  {
    id: "q-c4-1c",
    topicId: "c4-1",
    question: "Alkenes are tested using:",
    options: ["Litmus paper", "Lime water", "Bromine water", "Iodine solution"],
    correctIndex: 2,
    explanation: "Alkenes decolourise bromine water (orange → colourless).",
  },
  {
    id: "q-c4-1d",
    topicId: "c4-1",
    question: "General formula of alkanes is:",
    options: ["CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙH₂ₙ₋₂", "CₙHₙ"],
    correctIndex: 1,
  },
  {
    id: "q-c4-1e",
    topicId: "c4-1",
    question: "Ethanol is produced by fermentation using:",
    options: ["Bacteria", "Yeast", "Fungi", "Algae"],
    correctIndex: 1,
  },

  // Chemistry S4 - Rates of Reaction (c4-2)
  {
    id: "q-c4-2a",
    topicId: "c4-2",
    question: "Increasing temperature ___ reaction rate:",
    options: ["Decreases", "Increases", "Has no effect", "Stops"],
    correctIndex: 1,
  },
  {
    id: "q-c4-2b",
    topicId: "c4-2",
    question: "A catalyst:",
    options: [
      "Is used up in reaction",
      "Provides alternative pathway with lower activation energy",
      "Increases temperature",
      "Adds more reactant",
    ],
    correctIndex: 1,
  },
  {
    id: "q-c4-2c",
    topicId: "c4-2",
    question: "Powder reacts faster than lumps because:",
    options: ["It's heavier", "Larger surface area", "It's hotter", "Different substance"],
    correctIndex: 1,
  },

  // Chemistry S4 - Energy Changes (c4-3)
  {
    id: "q-c4-3a",
    topicId: "c4-3",
    question: "In exothermic reactions, temperature:",
    options: ["Rises", "Falls", "Stays same", "Fluctuates"],
    correctIndex: 0,
  },
  {
    id: "q-c4-3b",
    topicId: "c4-3",
    question: "Photosynthesis is:",
    options: ["Exothermic", "Endothermic", "Neither", "Both"],
    correctIndex: 1,
  },
  {
    id: "q-c4-3c",
    topicId: "c4-3",
    question: "Bond breaking is:",
    options: ["Exothermic", "Endothermic", "Neutral", "Impossible"],
    correctIndex: 1,
  },

  // Chemistry S4 - Equilibrium (c4-4)
  {
    id: "q-c4-4a",
    topicId: "c4-4",
    question: "A reversible reaction uses the symbol:",
    options: ["→", "⇌", "≡", "≠"],
    correctIndex: 1,
  },
  {
    id: "q-c4-4b",
    topicId: "c4-4",
    question: "Le Chatelier's principle: increasing concentration of reactant shifts equilibrium:",
    options: ["Backward", "Forward", "No change", "Stops reaction"],
    correctIndex: 1,
  },
  {
    id: "q-c4-4c",
    topicId: "c4-4",
    question: "Haber process conditions:",
    options: [
      "200°C, 1 atm",
      "450°C, 200 atm, iron catalyst",
      "1000°C, 500 atm",
      "Room temperature",
    ],
    correctIndex: 1,
  },
  {
    id: "q-c4-4d",
    topicId: "c4-4",
    question: "A catalyst affects equilibrium by:",
    options: [
      "Shifting it forward",
      "Shifting it backward",
      "Reaching it faster",
      "Changing the yield",
    ],
    correctIndex: 2,
  },

  // ═══════════════════════════════════════
  // BIOLOGY
  // ═══════════════════════════════════════

  // Biology S1 - Cell Structure (b1-1)
  {
    id: "q-b1-1a",
    topicId: "b1-1",
    question: "The basic unit of life is:",
    options: ["Tissue", "Organ", "Cell", "Organism"],
    correctIndex: 2,
  },
  {
    id: "q-b1-1b",
    topicId: "b1-1",
    question: "Which organelle is the 'powerhouse' of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"],
    correctIndex: 2,
  },
  {
    id: "q-b1-1c",
    topicId: "b1-1",
    question: "Plant cells have ___ but animal cells do not:",
    options: ["Nucleus", "Cell wall", "Cytoplasm", "Ribosomes"],
    correctIndex: 1,
  },
  {
    id: "q-b1-1d",
    topicId: "b1-1",
    question: "Chloroplasts contain ___ for photosynthesis:",
    options: ["Starch", "Chlorophyll", "Glucose", "Cellulose"],
    correctIndex: 1,
  },
  {
    id: "q-b1-1e",
    topicId: "b1-1",
    question: "The correct order of organisation is:",
    options: [
      "Organ→Cell→Tissue→System",
      "Cell→Tissue→Organ→System",
      "Tissue→Cell→System→Organ",
      "System→Organ→Tissue→Cell",
    ],
    correctIndex: 1,
  },

  // Biology S1 - Classification (b1-2)
  {
    id: "q-b1-2a",
    topicId: "b1-2",
    question: "Which kingdom includes mushrooms?",
    options: ["Plantae", "Animalia", "Fungi", "Protista"],
    correctIndex: 2,
  },
  {
    id: "q-b1-2b",
    topicId: "b1-2",
    question: "MRS GREN stands for the characteristics of:",
    options: ["Plants only", "Animals only", "All living things", "Fungi only"],
    correctIndex: 2,
  },
  {
    id: "q-b1-2c",
    topicId: "b1-2",
    question: "Warm-blooded animals with feathers are:",
    options: ["Mammals", "Reptiles", "Birds", "Amphibians"],
    correctIndex: 2,
  },
  {
    id: "q-b1-2d",
    topicId: "b1-2",
    question: "In binomial nomenclature, the correct format is:",
    options: ["HOMO SAPIENS", "homo sapiens", "Homo sapiens", "Homo Sapiens"],
    correctIndex: 2,
  },

  // Biology S1 - Photosynthesis (b1-3)
  {
    id: "q-b1-3a",
    topicId: "b1-3",
    question: "Photosynthesis produces:",
    options: ["CO₂ and water", "Glucose and oxygen", "Protein and fat", "Starch and CO₂"],
    correctIndex: 1,
  },
  {
    id: "q-b1-3b",
    topicId: "b1-3",
    question: "Where does photosynthesis occur?",
    options: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"],
    correctIndex: 2,
  },
  {
    id: "q-b1-3c",
    topicId: "b1-3",
    question: "The gas absorbed during photosynthesis is:",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctIndex: 2,
  },
  {
    id: "q-b1-3d",
    topicId: "b1-3",
    question: "Magnesium is needed for making:",
    options: ["Protein", "Chlorophyll", "Starch", "DNA"],
    correctIndex: 1,
  },
  {
    id: "q-b1-3e",
    topicId: "b1-3",
    question: "Stomata are found mainly on the ___ surface of leaves:",
    options: ["Upper", "Lower", "Side", "Inner"],
    correctIndex: 1,
  },

  // Biology S1 - Nutrition (b1-4)
  {
    id: "q-b1-4a",
    topicId: "b1-4",
    question: "The test for starch uses:",
    options: ["Benedict's solution", "Biuret reagent", "Iodine solution", "Litmus paper"],
    correctIndex: 2,
  },
  {
    id: "q-b1-4b",
    topicId: "b1-4",
    question: "Proteins are made of:",
    options: ["Fatty acids", "Amino acids", "Glucose units", "Nucleotides"],
    correctIndex: 1,
  },
  {
    id: "q-b1-4c",
    topicId: "b1-4",
    question: "Benedict's solution turns orange/red in the presence of:",
    options: ["Starch", "Protein", "Reducing sugar", "Fat"],
    correctIndex: 2,
  },
  {
    id: "q-b1-4d",
    topicId: "b1-4",
    question: "Amylase breaks down:",
    options: ["Protein", "Fat", "Starch", "DNA"],
    correctIndex: 2,
  },

  // Biology S2 - Transport (b2-1)
  {
    id: "q-b2-1a",
    topicId: "b2-1",
    question: "The main organ of the circulatory system is:",
    options: ["Lung", "Liver", "Heart", "Kidney"],
    correctIndex: 2,
  },
  {
    id: "q-b2-1b",
    topicId: "b2-1",
    question: "Which blood vessels carry blood away from the heart?",
    options: ["Veins", "Capillaries", "Arteries", "Venules"],
    correctIndex: 2,
  },
  {
    id: "q-b2-1c",
    topicId: "b2-1",
    question: "Red blood cells carry oxygen using:",
    options: ["Plasma", "Haemoglobin", "Platelets", "White blood cells"],
    correctIndex: 1,
  },
  {
    id: "q-b2-1d",
    topicId: "b2-1",
    question: "Gas exchange occurs in the:",
    options: ["Bronchi", "Trachea", "Alveoli", "Larynx"],
    correctIndex: 2,
  },
  {
    id: "q-b2-1e",
    topicId: "b2-1",
    question: "Platelets are responsible for:",
    options: ["Carrying oxygen", "Fighting infection", "Blood clotting", "Carrying nutrients"],
    correctIndex: 2,
  },

  // Biology S2 - Plant Transport (b2-2)
  {
    id: "q-b2-2a",
    topicId: "b2-2",
    question: "Xylem transports:",
    options: ["Sugars", "Water and minerals", "Amino acids", "Hormones"],
    correctIndex: 1,
  },
  {
    id: "q-b2-2b",
    topicId: "b2-2",
    question: "Transpiration is the loss of water from:",
    options: ["Roots", "Stem", "Leaves", "Flowers"],
    correctIndex: 2,
  },
  {
    id: "q-b2-2c",
    topicId: "b2-2",
    question: "Root hair cells absorb water by:",
    options: ["Active transport", "Osmosis", "Diffusion", "Evaporation"],
    correctIndex: 1,
  },

  // Biology S2 - Excretion (b2-3)
  {
    id: "q-b2-3a",
    topicId: "b2-3",
    question: "The kidney's main function is to:",
    options: ["Digest food", "Filter blood", "Pump blood", "Store glucose"],
    correctIndex: 1,
  },
  {
    id: "q-b2-3b",
    topicId: "b2-3",
    question: "Urea is produced in the:",
    options: ["Kidney", "Liver", "Lungs", "Skin"],
    correctIndex: 1,
  },
  {
    id: "q-b2-3c",
    topicId: "b2-3",
    question: "Excretion is the removal of:",
    options: ["Undigested food", "Metabolic waste", "Sweat only", "CO₂ only"],
    correctIndex: 1,
  },

  // Biology S2 - Reproduction in Plants (b2-4)
  {
    id: "q-b2-4a",
    topicId: "b2-4",
    question: "Pollen is produced by the:",
    options: ["Stigma", "Ovary", "Anther", "Style"],
    correctIndex: 2,
  },
  {
    id: "q-b2-4b",
    topicId: "b2-4",
    question: "After fertilisation, the ovule becomes a:",
    options: ["Fruit", "Seed", "Petal", "Root"],
    correctIndex: 1,
  },
  {
    id: "q-b2-4c",
    topicId: "b2-4",
    question: "Asexual reproduction produces offspring that are:",
    options: ["Different from parent", "Genetically identical", "Always bigger", "Always smaller"],
    correctIndex: 1,
  },

  // Biology S3 - Ecology (b3-1)
  {
    id: "q-b3-1a",
    topicId: "b3-1",
    question: "In a food chain, energy transfer is about:",
    options: ["100%", "50%", "10%", "1%"],
    correctIndex: 2,
  },
  {
    id: "q-b3-1b",
    topicId: "b3-1",
    question: "Nitrogen-fixing bacteria convert N₂ to:",
    options: ["Nitrites", "Nitrates", "Ammonia", "Nitrogen gas"],
    correctIndex: 2,
  },
  {
    id: "q-b3-1c",
    topicId: "b3-1",
    question: "Producers in a food chain are usually:",
    options: ["Animals", "Fungi", "Green plants", "Bacteria"],
    correctIndex: 2,
  },
  {
    id: "q-b3-1d",
    topicId: "b3-1",
    question: "An abiotic factor is:",
    options: ["Predation", "Competition", "Temperature", "Disease"],
    correctIndex: 2,
  },

  // Biology S3 - Nervous System (b3-2)
  {
    id: "q-b3-2a",
    topicId: "b3-2",
    question: "The CNS consists of:",
    options: ["Heart and lungs", "Brain and spinal cord", "Nerves only", "Muscles and bones"],
    correctIndex: 1,
  },
  {
    id: "q-b3-2b",
    topicId: "b3-2",
    question: "A reflex action is:",
    options: ["Slow and voluntary", "Fast and automatic", "Only in the brain", "Learned behaviour"],
    correctIndex: 1,
  },
  {
    id: "q-b3-2c",
    topicId: "b3-2",
    question: "Insulin controls:",
    options: ["Heart rate", "Blood sugar", "Body temperature", "Breathing"],
    correctIndex: 1,
  },
  {
    id: "q-b3-2d",
    topicId: "b3-2",
    question: "Homeostasis maintains:",
    options: ["Growth", "Constant internal environment", "Reproduction", "Digestion"],
    correctIndex: 1,
  },

  // Biology S3 - Reproduction (b3-3)
  {
    id: "q-b3-3a",
    topicId: "b3-3",
    question: "Fertilisation in humans occurs in the:",
    options: ["Uterus", "Vagina", "Oviduct (fallopian tube)", "Ovary"],
    correctIndex: 2,
  },
  {
    id: "q-b3-3b",
    topicId: "b3-3",
    question: "Ovulation occurs on approximately day ___ of the menstrual cycle:",
    options: ["1", "7", "14", "28"],
    correctIndex: 2,
  },
  {
    id: "q-b3-3c",
    topicId: "b3-3",
    question: "The placenta's function during pregnancy is to:",
    options: [
      "Produce milk",
      "Exchange nutrients and waste",
      "Support the baby's head",
      "Produce eggs",
    ],
    correctIndex: 1,
  },

  // Biology S3 - Respiration (b3-4)
  {
    id: "q-b3-4a",
    topicId: "b3-4",
    question: "Aerobic respiration needs:",
    options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
    correctIndex: 1,
  },
  {
    id: "q-b3-4b",
    topicId: "b3-4",
    question: "Anaerobic respiration in yeast produces:",
    options: ["Lactic acid", "Ethanol + CO₂", "Water + O₂", "Glucose"],
    correctIndex: 1,
  },
  {
    id: "q-b3-4c",
    topicId: "b3-4",
    question: "Which produces more energy?",
    options: ["Anaerobic", "Aerobic", "Both equal", "Neither"],
    correctIndex: 1,
  },

  // Biology S4 - Genetics (b4-1)
  {
    id: "q-b4-1a",
    topicId: "b4-1",
    question: "DNA base pairing: A pairs with:",
    options: ["G", "C", "T", "U"],
    correctIndex: 2,
  },
  {
    id: "q-b4-1b",
    topicId: "b4-1",
    question: "In Mendel's cross Tt × Tt, the ratio of tall to short is:",
    options: ["1:1", "3:1", "1:3", "2:1"],
    correctIndex: 1,
  },
  {
    id: "q-b4-1c",
    topicId: "b4-1",
    question: "A recessive trait is expressed when the genotype is:",
    options: ["TT", "Tt", "tt", "TT or Tt"],
    correctIndex: 2,
  },
  {
    id: "q-b4-1d",
    topicId: "b4-1",
    question: "Natural selection leads to:",
    options: ["Extinction only", "Evolution", "No change", "Cloning"],
    correctIndex: 1,
  },

  // Biology S4 - Biotechnology (b4-2)
  {
    id: "q-b4-2a",
    topicId: "b4-2",
    question: "Genetic engineering uses ___ enzymes to cut DNA:",
    options: ["Ligase", "Restriction", "Amylase", "Lipase"],
    correctIndex: 1,
  },
  {
    id: "q-b4-2b",
    topicId: "b4-2",
    question: "Selective breeding aims to:",
    options: [
      "Create new species",
      "Improve desired traits",
      "Kill weak organisms",
      "Mix all traits equally",
    ],
    correctIndex: 1,
  },
  {
    id: "q-b4-2c",
    topicId: "b4-2",
    question: "In bread-making, yeast produces ___ which makes bread rise:",
    options: ["Oxygen", "Ethanol", "Carbon dioxide", "Lactic acid"],
    correctIndex: 2,
  },

  // Biology S4 - Disease (b4-3)
  {
    id: "q-b4-3a",
    topicId: "b4-3",
    question: "Antibiotics work against:",
    options: ["Viruses", "Bacteria", "All pathogens", "Fungi only"],
    correctIndex: 1,
  },
  {
    id: "q-b4-3b",
    topicId: "b4-3",
    question: "Malaria is caused by:",
    options: ["Virus", "Bacterium", "Protist (Plasmodium)", "Fungus"],
    correctIndex: 2,
  },
  {
    id: "q-b4-3c",
    topicId: "b4-3",
    question: "Vaccination works by:",
    options: [
      "Killing all bacteria",
      "Stimulating antibody production and memory cells",
      "Removing pathogens from blood",
      "Increasing body temperature",
    ],
    correctIndex: 1,
  },
  {
    id: "q-b4-3d",
    topicId: "b4-3",
    question: "HIV attacks:",
    options: ["Red blood cells", "Helper T-cells", "Platelets", "Nerve cells"],
    correctIndex: 1,
  },

  // Biology S4 - Environment (b4-4)
  {
    id: "q-b4-4a",
    topicId: "b4-4",
    question: "Which is an example of a renewable resource?",
    options: ["Coal", "Oil", "Solar energy", "Natural gas"],
    correctIndex: 2,
  },
  {
    id: "q-b4-4b",
    topicId: "b4-4",
    question: "Deforestation leads to:",
    options: ["More rainfall", "Soil erosion", "Decreased CO₂", "Cooler climate"],
    correctIndex: 1,
  },
  {
    id: "q-b4-4c",
    topicId: "b4-4",
    question: "Eutrophication is caused by excess:",
    options: ["Oxygen", "Fertilisers in water", "Carbon dioxide", "Salt"],
    correctIndex: 1,
  },
  {
    id: "q-b4-4d",
    topicId: "b4-4",
    question: "The main greenhouse gas is:",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctIndex: 2,
  },

  // ── ECONOMICS ──
  {
    id: "q-ec5-1a",
    topicId: "ec5-1",
    question: "What is the fundamental economic problem?",
    options: ["Unemployment", "Inflation", "Scarcity of resources", "High taxation"],
    correctIndex: 2,
    explanation:
      "Scarcity is the basic economic problem, as human wants are infinite but resources are limited.",
  },
  {
    id: "q-ec5-1b",
    topicId: "ec5-1",
    question: "Opportunity cost is defined as:",
    options: [
      "The cash price paid for a good",
      "The next best alternative forgone",
      "The total manufacturing cost",
      "The loss of business utility",
    ],
    correctIndex: 1,
    explanation:
      "Opportunity cost is the value of the next best choice that you give up when making a decision.",
  },
  {
    id: "q-ec5-2a",
    topicId: "ec5-2",
    question: "The Law of Demand states that, ceteris paribus:",
    options: [
      "As price rises, demand rises",
      "As price rises, quantity demanded falls",
      "As income rises, demand falls",
      "As supply rises, price rises",
    ],
    correctIndex: 1,
    explanation:
      "The Law of Demand describes an inverse relationship between price and quantity demanded.",
  },
  {
    id: "q-ec6-1a",
    topicId: "ec6-1",
    question:
      "Which of the following is the standard formula for GDP using the expenditure approach?",
    options: [
      "GDP = C + I + G",
      "GDP = C + I + G + (X - M)",
      "GDP = C + S + T",
      "GDP = Net National Income - Depreciation",
    ],
    correctIndex: 1,
    explanation:
      "GDP = Consumption (C) + Investment (I) + Government spending (G) + Net exports (X - M).",
  },

  // ── ICT ──
  {
    id: "q-ict1-1a",
    topicId: "ict1-1",
    question: "Which of the following is classified as an input device?",
    options: ["Monitor", "Printer", "Keyboard", "Speaker"],
    correctIndex: 2,
    explanation: "A keyboard is used to enter data into the computer, making it an input device.",
  },
  {
    id: "q-ict2-1a",
    topicId: "ict2-1",
    question:
      "Which feature allows you to send a single document template to multiple recipients with customized fields?",
    options: ["Mail Merge", "Hyperlink", "Macro", "Cross-reference"],
    correctIndex: 0,
    explanation: "Mail Merge is used to personalize generic templates for a bulk list of contacts.",
  },
  {
    id: "q-ict5-1a",
    topicId: "ict5-1",
    question: "In spreadsheet software, what does the formula '=AVERAGE(C1:C5)' do?",
    options: [
      "Adds C1 and C5",
      "Finds the arithmetic mean of cells C1 through C5",
      "Compares values of C1 and C5",
      "Counts the number of cells containing text",
    ],
    correctIndex: 1,
    explanation:
      "=AVERAGE calculates the average (mean) of all numeric values in the specified cell range.",
  },

  // ── DIVINITY ──
  {
    id: "q-div5-1a",
    topicId: "div5-1",
    question:
      "Which of the following describes the primary role of Old Testament prophets in Israel?",
    options: [
      "To predict the far future exclusively",
      "To serve as military commanders",
      "To act as God's spokespersons calling for covenant faithfulness",
      "To administer temple sacrifices",
    ],
    correctIndex: 2,
    explanation:
      "Prophets were primarily messengers of God who called Israel back to justice, righteousness, and covenant loyalty.",
  },

  // ── KISWAHILI ──
  {
    id: "q-sw1-1a",
    topicId: "sw1-1",
    question: "What is the standard response to the greeting 'Hujambo'?",
    options: ["Sijambo", "Nzuri", "Salama", "Marahaba"],
    correctIndex: 0,
    explanation: "'Hujambo' is answered with 'Sijambo' (I have no issues / I am fine).",
  },

  // ── LUGANDA ──
  {
    id: "q-lug1-1a",
    topicId: "lug1-1",
    question:
      "Which of the following is the correct plural noun class prefix for 'Omuntu' (Person)?",
    options: ["Ebi-", "Aba-", "Emi-", "Ama-"],
    correctIndex: 1,
    explanation: "The plural of 'Omuntu' is 'Abantu' using the prefix 'Aba-'.",
  },

  // ── LITERATURE ──
  {
    id: "q-lit1-1a",
    topicId: "lit1-1",
    question: "Which literary genre is written specifically to be performed on a stage by actors?",
    options: ["Prose", "Poetry", "Drama", "Biography"],
    correctIndex: 2,
    explanation: "Drama is written in dialogue form as a script intended for stage representation.",
  },

  // ── AGRICULTURE ──
  {
    id: "q-ag1-1a",
    topicId: "ag1-1",
    question:
      "Which soil horizon is generally the most fertile and contains high amounts of organic matter?",
    options: [
      "Horizon A (Topsoil)",
      "Horizon B (Subsoil)",
      "Horizon C (Parent material)",
      "Bedrock",
    ],
    correctIndex: 0,
    explanation:
      "Horizon A (Topsoil) is rich in organic humus and minerals, making it highly fertile for plant growth.",
  },

  // ── FINE ART ──
  {
    id: "q-art1-1a",
    topicId: "art1-1",
    question: "What is drawing inanimate objects such as fruit, bottles, and boxes called?",
    options: ["Landscape drawing", "Still life drawing", "Portraiture", "Abstract painting"],
    correctIndex: 1,
    explanation: "Still life is the traditional study of arranged, non-moving physical objects.",
  },

  // ── CRE ──
  {
    id: "q-cre1-1a",
    topicId: "cre1-1",
    question: "According to the Genesis accounts, in whose image did God create human beings?",
    options: [
      "In the image of angels",
      "In God's own image",
      "In the likeness of other creatures",
      "In the image of the stars",
    ],
    correctIndex: 1,
    explanation: "Genesis 1:27 states that God created mankind in His own image and likeness.",
  },
];
