export interface NoteSection {
  heading: string;
  content: string;
}

export interface TopicNote {
  topicId: string;
  sections: NoteSection[];
  examples?: { problem: string; solution: string }[];
}

export const topicNotes: TopicNote[] = [
  // ═══════════════════════════════════════════
  // MATHEMATICS
  // ═══════════════════════════════════════════

  // ── MATH S1 ──

  {
    topicId: "m1-1",
    sections: [
      {
        heading: "Introduction",
        content:
          "Number systems form the foundation of all mathematics. In Senior 1, you learn about natural numbers (1, 2, 3, …), whole numbers (0, 1, 2, …), integers (… -2, -1, 0, 1, 2 …), fractions, and decimals.",
      },
      {
        heading: "Place Value",
        content:
          "Every digit in a number has a place value. For example, in 3 472: 3 is in the thousands place, 4 in hundreds, 7 in tens, and 2 in ones.",
      },
      {
        heading: "BODMAS Rule",
        content:
          "When evaluating expressions, follow the order: Brackets → Orders (powers) → Division → Multiplication → Addition → Subtraction. Example: 3 + 4 × 2 = 3 + 8 = 11 (NOT 14).",
      },
      {
        heading: "Fractions",
        content:
          "A fraction a/b represents 'a' parts out of 'b' equal parts. To add fractions with different denominators, find the LCM of the denominators. Example: ¾ + ⅔ = 9/12 + 8/12 = 17/12.",
      },
      {
        heading: "LCM and HCF",
        content:
          "LCM (Lowest Common Multiple) is the smallest number divisible by both numbers. HCF (Highest Common Factor) is the largest number that divides both numbers exactly. Use prime factorisation to find them.",
      },
      {
        heading: "Prime Factorisation",
        content:
          "Express a number as a product of prime factors. Example: 60 = 2² × 3 × 5. This helps in finding LCM and HCF.",
      },
    ],
    examples: [
      {
        problem: "Find the LCM of 12 and 18.",
        solution: "12 = 2² × 3, 18 = 2 × 3². LCM = 2² × 3² = 36.",
      },
      {
        problem: "Evaluate: 5 + 3 × (8 - 2)",
        solution: "Brackets first: 8 - 2 = 6. Then multiply: 3 × 6 = 18. Then add: 5 + 18 = 23.",
      },
    ],
  },
  {
    topicId: "m1-2",
    sections: [
      {
        heading: "Introduction",
        content:
          "Algebra uses letters (variables) to represent unknown numbers. It allows us to write general rules and solve problems.",
      },
      {
        heading: "Variables and Constants",
        content:
          "A variable (like x, y) can take different values. A constant (like 5, -3) has a fixed value. In the expression 3x + 7, '3x' is a variable term and '7' is a constant.",
      },
      {
        heading: "Simplifying Expressions",
        content:
          "Combine like terms (terms with the same variable). Example: 3a + 5b + 2a - b = (3a + 2a) + (5b - b) = 5a + 4b.",
      },
      {
        heading: "Solving Linear Equations",
        content:
          "To solve ax + b = c: subtract b from both sides, then divide by a. Example: 2x + 5 = 13 → 2x = 8 → x = 4.",
      },
      {
        heading: "Substitution",
        content:
          "Replace the variable with a given value. Example: If y = 3, find 2y² + 1 = 2(9) + 1 = 19.",
      },
    ],
    examples: [
      { problem: "Solve: 3x - 7 = 14", solution: "3x = 14 + 7 = 21. x = 21 ÷ 3 = 7." },
      { problem: "Simplify: 4m + 3n - 2m + 5n", solution: "(4m - 2m) + (3n + 5n) = 2m + 8n." },
    ],
  },
  {
    topicId: "m1-3",
    sections: [
      {
        heading: "Introduction",
        content:
          "Geometry is the study of shapes, sizes and positions. In S.1, we study points, lines, angles, and basic shapes like triangles.",
      },
      {
        heading: "Types of Angles",
        content:
          "Acute: less than 90°. Right: exactly 90°. Obtuse: between 90° and 180°. Straight: 180°. Reflex: between 180° and 360°.",
      },
      {
        heading: "Angles on Lines",
        content:
          "Angles on a straight line add up to 180°. Angles at a point add up to 360°. Vertically opposite angles are equal.",
      },
      {
        heading: "Angles on Parallel Lines",
        content:
          "When a transversal crosses parallel lines: Alternate angles are equal (Z-shape). Corresponding angles are equal (F-shape). Co-interior angles add up to 180° (C-shape).",
      },
      {
        heading: "Properties of Triangles",
        content:
          "Sum of interior angles = 180°. An equilateral triangle has all sides equal and all angles 60°. An isosceles triangle has two equal sides and two equal base angles.",
      },
    ],
    examples: [
      {
        problem: "Two angles on a straight line are x° and 130°. Find x.",
        solution: "x + 130 = 180. x = 50°.",
      },
    ],
  },
  {
    topicId: "m1-4",
    sections: [
      {
        heading: "Conversions",
        content:
          "Fraction to decimal: divide numerator by denominator (¾ = 0.75). Decimal to percentage: multiply by 100 (0.75 = 75%). Percentage to fraction: write over 100 and simplify (75% = 75/100 = ¾).",
      },
      {
        heading: "Percentage of a Quantity",
        content: "To find P% of Q: multiply P/100 × Q. Example: 20% of 350 = 0.2 × 350 = 70.",
      },
      {
        heading: "Percentage Increase/Decrease",
        content:
          "Increase: New value = Original + (P% of Original). Decrease: New value = Original - (P% of Original). Percentage change = (change/original) × 100%.",
      },
    ],
    examples: [
      {
        problem: "A shirt costs UGX 25,000. It is reduced by 15%. Find the new price.",
        solution: "Discount = 15% of 25,000 = 3,750. New price = 25,000 - 3,750 = UGX 21,250.",
      },
    ],
  },
  {
    topicId: "m1-5",
    sections: [
      {
        heading: "Introduction",
        content:
          "A ratio compares two or more quantities. The ratio a:b means for every 'a' of the first, there are 'b' of the second.",
      },
      {
        heading: "Simplifying Ratios",
        content: "Divide all parts by their HCF. Example: 12:18 → divide by 6 → 2:3.",
      },
      {
        heading: "Dividing in a Ratio",
        content:
          "Add total parts, then share. Example: Share 200 in ratio 3:2. Total = 5 parts. First share = 3/5 × 200 = 120. Second share = 2/5 × 200 = 80.",
      },
      {
        heading: "Direct Proportion",
        content:
          "Two quantities are in direct proportion if they increase or decrease together at the same rate. Use the unitary method: find the value of one unit first.",
      },
    ],
    examples: [
      {
        problem: "If 5 books cost UGX 15,000, how much do 8 books cost?",
        solution: "1 book = 15,000 ÷ 5 = 3,000. 8 books = 3,000 × 8 = UGX 24,000.",
      },
    ],
  },
  {
    topicId: "m1-6",
    sections: [
      {
        heading: "Rectangles and Squares",
        content:
          "Rectangle: Area = length × width, Perimeter = 2(l + w). Square: Area = s², Perimeter = 4s.",
      },
      {
        heading: "Triangles",
        content: "Area = ½ × base × height. The height must be perpendicular to the base.",
      },
      {
        heading: "Circles",
        content:
          "Circumference = 2πr = πd. Area = πr². Use π = 22/7 or 3.14 unless told otherwise.",
      },
      {
        heading: "Composite Shapes",
        content:
          "Break the shape into simpler shapes (rectangles, triangles, semicircles). Find each area separately and add or subtract.",
      },
    ],
    examples: [
      {
        problem: "Find the area of a circle with diameter 14 cm.",
        solution: "Radius = 7 cm. Area = πr² = 22/7 × 7 × 7 = 154 cm².",
      },
    ],
  },
  {
    topicId: "m1-7",
    sections: [
      {
        heading: "Laws of Indices",
        content:
          "Multiplication: aᵐ × aⁿ = aᵐ⁺ⁿ. Division: aᵐ ÷ aⁿ = aᵐ⁻ⁿ. Power of a power: (aᵐ)ⁿ = aᵐⁿ. Zero index: a⁰ = 1. Negative index: a⁻ⁿ = 1/aⁿ.",
      },
      {
        heading: "Standard Form",
        content:
          "A number in standard form is written as A × 10ⁿ where 1 ≤ A < 10. Example: 45,000 = 4.5 × 10⁴. Example: 0.003 = 3 × 10⁻³.",
      },
    ],
    examples: [
      { problem: "Simplify: (2³)² × 2⁴", solution: "(2³)² = 2⁶. Then 2⁶ × 2⁴ = 2¹⁰ = 1024." },
    ],
  },

  // ── MATH S2 ──

  {
    topicId: "m2-1",
    sections: [
      {
        heading: "The Theorem",
        content:
          "In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c², where c is the hypotenuse (longest side, opposite the right angle).",
      },
      {
        heading: "Finding the Hypotenuse",
        content: "c = √(a² + b²). Example: If a = 6 and b = 8, then c = √(36 + 64) = √100 = 10.",
      },
      {
        heading: "Finding a Shorter Side",
        content: "a = √(c² - b²). Example: If c = 13 and b = 5, then a = √(169 - 25) = √144 = 12.",
      },
      {
        heading: "Pythagorean Triples",
        content:
          "Common sets: (3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25). Multiples also work: (6, 8, 10) is 2×(3, 4, 5).",
      },
    ],
    examples: [
      {
        problem:
          "A ladder 10 m long leans against a wall. The foot is 6 m from the wall. How high up the wall does it reach?",
        solution: "h = √(10² - 6²) = √(100 - 36) = √64 = 8 m.",
      },
    ],
  },
  {
    topicId: "m2-2",
    sections: [
      {
        heading: "Trigonometric Ratios (SOH CAH TOA)",
        content:
          "sin θ = Opposite / Hypotenuse. cos θ = Adjacent / Hypotenuse. tan θ = Opposite / Adjacent. Memory aid: SOH CAH TOA.",
      },
      {
        heading: "Finding a Missing Side",
        content:
          "Identify the sides relative to the angle. Choose the correct ratio. Substitute and solve.",
      },
      {
        heading: "Finding a Missing Angle",
        content: "Use the inverse function: θ = sin⁻¹(O/H), θ = cos⁻¹(A/H), or θ = tan⁻¹(O/A).",
      },
      {
        heading: "Angles of Elevation and Depression",
        content:
          "Angle of elevation: looking UP from horizontal. Angle of depression: looking DOWN from horizontal. Both are measured from the horizontal.",
      },
      {
        heading: "Special Angles",
        content:
          "sin 30° = ½, cos 30° = √3/2, tan 30° = 1/√3. sin 45° = √2/2, cos 45° = √2/2, tan 45° = 1. sin 60° = √3/2, cos 60° = ½, tan 60° = √3.",
      },
    ],
    examples: [
      {
        problem:
          "A tree casts a shadow 12 m long. The angle of elevation of the sun is 40°. Find the height of the tree.",
        solution: "tan 40° = height/12. Height = 12 × tan 40° = 12 × 0.839 = 10.07 m.",
      },
    ],
  },
  {
    topicId: "m2-3",
    sections: [
      {
        heading: "Substitution Method",
        content:
          "Step 1: From one equation, express one variable in terms of the other. Step 2: Substitute into the second equation. Step 3: Solve for the remaining variable. Step 4: Back-substitute to find the other.",
      },
      {
        heading: "Elimination Method",
        content:
          "Step 1: Make the coefficients of one variable the same. Step 2: Add or subtract the equations to eliminate that variable. Step 3: Solve and back-substitute.",
      },
    ],
    examples: [
      {
        problem: "Solve: 2x + y = 7 and x - y = 2",
        solution:
          "Add both equations: 3x = 9, x = 3. From x - y = 2: 3 - y = 2, y = 1. Solution: x = 3, y = 1.",
      },
    ],
  },
  {
    topicId: "m2-4",
    sections: [
      {
        heading: "Simplifying",
        content:
          "Factorise numerator and denominator, then cancel common factors. Example: (x² - 4)/(x + 2) = (x - 2)(x + 2)/(x + 2) = x - 2.",
      },
      {
        heading: "Operations",
        content:
          "Addition/Subtraction: Find a common denominator first, just like numerical fractions. Multiplication: multiply numerators and denominators. Division: invert and multiply.",
      },
    ],
  },
  {
    topicId: "m2-5",
    sections: [
      {
        heading: "Equation of a Line",
        content:
          "The general form is y = mx + c, where m = gradient (slope) and c = y-intercept. To find m between two points: m = (y₂ - y₁)/(x₂ - x₁).",
      },
      {
        heading: "Parallel and Perpendicular",
        content:
          "Parallel lines have equal gradients (m₁ = m₂). Perpendicular lines have gradients whose product is -1 (m₁ × m₂ = -1).",
      },
      {
        heading: "Distance-Time Graphs",
        content:
          "Gradient = speed. A flat line means stationary. A steeper line means faster speed.",
      },
    ],
    examples: [
      {
        problem: "Find the gradient of the line through (1, 3) and (4, 9).",
        solution: "m = (9 - 3)/(4 - 1) = 6/3 = 2.",
      },
    ],
  },
  {
    topicId: "m2-6",
    sections: [
      {
        heading: "Solving Inequalities",
        content:
          "Solve like equations, but reverse the sign when multiplying or dividing by a negative. Example: -2x > 6 → x < -3.",
      },
      {
        heading: "Number Line Representation",
        content:
          "Open circle ○ for < or >. Filled circle ● for ≤ or ≥. Shade the region that satisfies the inequality.",
      },
    ],
  },
  {
    topicId: "m2-7",
    sections: [
      {
        heading: "Set Notation",
        content:
          "∈ means 'is a member of'. ∪ is union (everything in both). ∩ is intersection (only what's shared). A' is the complement (everything NOT in A).",
      },
      {
        heading: "Venn Diagrams",
        content:
          "Use overlapping circles to show relationships. For two sets: n(A ∪ B) = n(A) + n(B) - n(A ∩ B). Start filling from the intersection.",
      },
    ],
    examples: [
      {
        problem:
          "In a class of 40: 25 play football, 20 play netball, 10 play both. How many play neither?",
        solution: "n(F ∪ N) = 25 + 20 - 10 = 35. Neither = 40 - 35 = 5.",
      },
    ],
  },
  {
    topicId: "m2-8",
    sections: [
      {
        heading: "Reflection",
        content:
          "A mirror image across a line. Reflect across x-axis: (x, y) → (x, -y). Across y-axis: (x, y) → (-x, y). Across y = x: (x, y) → (y, x).",
      },
      {
        heading: "Rotation",
        content:
          "Turn about a fixed point (centre of rotation) by a given angle. Clockwise is negative, anticlockwise is positive.",
      },
      {
        heading: "Translation",
        content: "Slide by a vector (a, b). Every point moves 'a' units right and 'b' units up.",
      },
      {
        heading: "Enlargement",
        content:
          "Scale from a centre by a scale factor k. Distances from centre multiply by k. If k > 1 shape gets bigger, if 0 < k < 1 it shrinks.",
      },
    ],
  },

  // ── MATH S3 ──

  {
    topicId: "m3-1",
    sections: [
      {
        heading: "Factorisation",
        content:
          "Write ax² + bx + c = 0. Find two numbers that multiply to ac and add to b. Example: x² - 5x + 6 = (x - 2)(x - 3) = 0, so x = 2 or x = 3.",
      },
      {
        heading: "Completing the Square",
        content:
          "Write x² + bx as (x + b/2)² - (b/2)². Useful for finding the turning point of a parabola.",
      },
      {
        heading: "Quadratic Formula",
        content:
          "x = (-b ± √(b² - 4ac)) / 2a. Works for ALL quadratics. The discriminant Δ = b² - 4ac tells us: Δ > 0 → two real roots, Δ = 0 → one repeated root, Δ < 0 → no real roots.",
      },
    ],
    examples: [
      {
        problem: "Solve: 2x² + 5x - 3 = 0",
        solution: "a=2, b=5, c=-3. x = (-5 ± √(25+24))/4 = (-5 ± 7)/4. x = ½ or x = -3.",
      },
    ],
  },
  {
    topicId: "m3-2",
    sections: [
      {
        heading: "Key Theorems",
        content:
          "1) Angle at centre = 2 × angle at circumference. 2) Angles in the same segment are equal. 3) Angle in a semicircle = 90°. 4) Opposite angles of a cyclic quadrilateral sum to 180°.",
      },
      {
        heading: "Tangent Properties",
        content:
          "A tangent is perpendicular to the radius at the point of contact. Two tangents from an external point are equal in length. Alternate segment theorem: angle between tangent and chord = angle in alternate segment.",
      },
      {
        heading: "Arc Length and Sector Area",
        content: "Arc length = (θ/360) × 2πr. Sector area = (θ/360) × πr².",
      },
    ],
  },
  {
    topicId: "m3-3",
    sections: [
      {
        heading: "Arithmetic Progressions (AP)",
        content:
          "Common difference d = a₂ - a₁. nth term: aₙ = a + (n-1)d. Sum of n terms: Sₙ = n/2 [2a + (n-1)d] or Sₙ = n/2 (first + last).",
      },
      {
        heading: "Geometric Progressions (GP)",
        content:
          "Common ratio r = a₂/a₁. nth term: aₙ = arⁿ⁻¹. Sum of n terms: Sₙ = a(rⁿ - 1)/(r - 1) when r ≠ 1. Sum to infinity (|r| < 1): S∞ = a/(1 - r).",
      },
    ],
    examples: [
      {
        problem: "Find the 10th term of the AP: 3, 7, 11, 15, …",
        solution: "a = 3, d = 4. a₁₀ = 3 + (10-1)(4) = 3 + 36 = 39.",
      },
    ],
  },
  {
    topicId: "m3-4",
    sections: [
      {
        heading: "Sine Rule",
        content:
          "a/sin A = b/sin B = c/sin C. Used when you know: two angles and one side, OR two sides and an angle opposite one of them.",
      },
      {
        heading: "Cosine Rule",
        content:
          "a² = b² + c² - 2bc cos A. Used when you know: all three sides (to find an angle), OR two sides and the included angle (to find the third side).",
      },
      {
        heading: "Area of Triangle",
        content: "Area = ½ab sin C, where a and b are two sides and C is the included angle.",
      },
    ],
    examples: [
      {
        problem: "In triangle ABC, a = 8, b = 6, C = 60°. Find the area.",
        solution: "Area = ½ × 8 × 6 × sin 60° = 24 × (√3/2) = 12√3 ≈ 20.78 square units.",
      },
    ],
  },
  {
    topicId: "m3-5",
    sections: [
      {
        heading: "Direct Variation",
        content:
          "y ∝ x means y = kx. As x increases, y increases proportionally. Find k using given values.",
      },
      {
        heading: "Inverse Variation",
        content: "y ∝ 1/x means y = k/x. As x increases, y decreases.",
      },
      {
        heading: "Joint Variation",
        content:
          "y varies jointly as x and z: y = kxz. Partial variation: y = kx + c (part varies, part constant).",
      },
    ],
  },
  {
    topicId: "m3-6",
    sections: [
      {
        heading: "Definition",
        content: "If aˣ = b, then x = logₐ b. Example: 2³ = 8, so log₂ 8 = 3.",
      },
      {
        heading: "Laws of Logarithms",
        content:
          "log(ab) = log a + log b. log(a/b) = log a - log b. log aⁿ = n log a. log 1 = 0. logₐ a = 1.",
      },
      {
        heading: "Solving Exponential Equations",
        content: "Take log of both sides. Example: 3ˣ = 20 → x = log 20 / log 3 ≈ 2.727.",
      },
    ],
  },

  // ── MATH S4 ──

  {
    topicId: "m4-1",
    sections: [
      {
        heading: "Matrix Operations",
        content:
          "Addition/subtraction: add/subtract corresponding elements (same order only). Scalar multiplication: multiply every element. Matrix multiplication: row × column (order matters!).",
      },
      {
        heading: "Determinant and Inverse",
        content:
          "For 2×2 matrix [a b; c d]: det = ad - bc. If det ≠ 0, inverse = (1/det)[d -b; -c a]. A matrix with det = 0 is singular (no inverse).",
      },
      {
        heading: "Transformation Matrices",
        content:
          "Reflection in x-axis: [1 0; 0 -1]. Reflection in y-axis: [-1 0; 0 1]. Rotation 90° anticlockwise: [0 -1; 1 0]. Enlargement scale factor k: [k 0; 0 k].",
      },
    ],
  },
  {
    topicId: "m4-2",
    sections: [
      {
        heading: "Measures of Central Tendency",
        content:
          "Mean = Σx/n (or Σfx/Σf for grouped data). Median: middle value when arranged in order. Mode: most frequent value.",
      },
      {
        heading: "Standard Deviation",
        content: "σ = √(Σ(x - x̄)²/n). A smaller σ means data is closely packed around the mean.",
      },
      {
        heading: "Probability",
        content:
          "P(event) = favourable outcomes / total outcomes. P(A or B) = P(A) + P(B) - P(A and B). P(A and B) = P(A) × P(B) for independent events.",
      },
      {
        heading: "Cumulative Frequency",
        content:
          "Add frequencies cumulatively. Plot an S-curve. Read off median (n/2), lower quartile (n/4), upper quartile (3n/4). Interquartile range = Q3 - Q1.",
      },
    ],
  },
  {
    topicId: "m4-3",
    sections: [
      {
        heading: "Column Vectors",
        content:
          "A vector is written as (x, y) representing movement x in the horizontal and y in the vertical direction. Magnitude: |v| = √(x² + y²).",
      },
      {
        heading: "Vector Operations",
        content:
          "Addition: (a,b) + (c,d) = (a+c, b+d). Scalar multiplication: k(a,b) = (ka, kb). Subtraction: AB = OB - OA.",
      },
      {
        heading: "Midpoint",
        content: "Midpoint of A and B = (OA + OB)/2. To divide in ratio m:n use section formula.",
      },
    ],
  },
  {
    topicId: "m4-4",
    sections: [
      {
        heading: "Differentiation Rules",
        content:
          "Power rule: d/dx (xⁿ) = nxⁿ⁻¹. Constant: d/dx (c) = 0. Sum rule: differentiate term by term.",
      },
      {
        heading: "Applications",
        content:
          "Gradient at a point: substitute x into dy/dx. Tangent: y - y₁ = m(x - x₁) where m = dy/dx. Stationary points: set dy/dx = 0 and solve.",
      },
      {
        heading: "Maximum and Minimum",
        content: "Find d²y/dx². If d²y/dx² > 0 → minimum. If d²y/dx² < 0 → maximum.",
      },
    ],
    examples: [
      {
        problem: "Find the stationary points of y = x³ - 3x + 2.",
        solution: "dy/dx = 3x² - 3 = 0 → x² = 1 → x = ±1. At x=1: y=0 (min). At x=-1: y=4 (max).",
      },
    ],
  },
  {
    topicId: "m4-5",
    sections: [
      {
        heading: "Integration Rules",
        content: "∫xⁿ dx = xⁿ⁺¹/(n+1) + c (n ≠ -1). ∫k dx = kx + c. Integrate term by term.",
      },
      {
        heading: "Definite Integrals",
        content:
          "∫ₐᵇ f(x) dx = F(b) - F(a). This gives the exact area under the curve between x = a and x = b.",
      },
      {
        heading: "Area Under a Curve",
        content:
          "If the curve is below the x-axis, the integral is negative. Take the absolute value for area. For area between two curves: ∫(upper - lower) dx.",
      },
    ],
  },
  {
    topicId: "m4-6",
    sections: [
      {
        heading: "Setting Up",
        content:
          "Read the problem and define variables. Write the constraints as inequalities. Write the objective function (what to maximise or minimise).",
      },
      {
        heading: "Graphical Solution",
        content:
          "Graph each inequality. Shade the unwanted region. The unshaded (feasible) region contains all possible solutions. Test vertices of the feasible region in the objective function.",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // PHYSICS (Expanded from Uganda curriculum)
  // ═══════════════════════════════════════════

  // ── PHYSICS S1 ──

  {
    topicId: "p1-1",
    sections: [
      {
        heading: "What is Physics?",
        content:
          "Physics is a Greek word meaning 'nature'. It is the study of matter and its relation to energy. Physics deals with natural phenomena and explains bulk properties of matter. A physicist explains how things work, from simple machines to the universe.",
      },
      {
        heading: "Branches of Physics",
        content:
          "1. Mechanics – study of motion under the influence of force. 2. Electricity – movement of charge through conductors. 3. Magnetism – magnets and magnetic fields. 4. Thermodynamics/Heat – transformation of heat energy. 5. Optics – study of light. 6. Waves – study of disturbances through media. 7. Particle physics. 8. Nuclear physics. 9. Plasma physics.",
      },
      {
        heading: "SI Units and Basic Quantities",
        content:
          "In 1971, the International System of Units (SI) established seven base quantities: Length (metre, m), Mass (kilogram, kg), Time (second, s), Electric current (ampere, A), Temperature (kelvin, K), Luminous intensity (candela, cd), Amount of substance (mole, mol). All other quantities are derived from these.",
      },
      {
        heading: "Length, Area, and Volume",
        content:
          "Length is measured using a metre rule (100 cm), tape measure, vernier calipers (±0.01 cm) or micrometer screw gauge (±0.01 mm). Area = length × width (SI unit: m²). Volume is the amount of space occupied by matter (SI unit: m³). 1 m³ = 1,000,000 cm³. 1 litre = 1,000 cm³.",
      },
      {
        heading: "Mass",
        content:
          "Mass is the quantity of matter in a substance. SI unit: kilogram (kg). Sub-multiples: grams (g), milligrams (mg), tonnes (t). 1 kg = 1,000 g. Mass is measured using a beam balance. Mass is constant regardless of location, unlike weight.",
      },
      {
        heading: "Density",
        content:
          "Density (ρ) = mass/volume. SI unit: kg/m³. Common densities: water = 1,000 kg/m³, ice = 920 kg/m³, iron = 7,860 kg/m³, aluminium = 2,700 kg/m³, mercury = 13,600 kg/m³, air = 1.31 kg/m³. To find density of irregular objects, use water displacement to measure volume.",
      },
      {
        heading: "Relative Density",
        content:
          "Relative density (d) = density of substance / density of water. It has no units since it is a ratio. Measured using a relative density bottle. Example: If relative density of wood is 0.8, then density = 0.8 × 1,000 = 800 kg/m³.",
      },
      {
        heading: "Vernier Calipers",
        content:
          "Read main scale first, then find which vernier line aligns with a main scale line. Total reading = main scale reading + (vernier division × 0.01 cm). Can measure internal and external dimensions, and depth.",
      },
      {
        heading: "Micrometer Screw Gauge",
        content:
          "Main scale reads in mm. Thimble scale has 50 divisions, each = 0.01 mm. Total reading = main scale + thimble reading. Used for measuring thickness of wires, sheets, and small objects.",
      },
    ],
    examples: [
      {
        problem:
          "A block of glass of mass 187.5 g is 5.0 cm long, 2.0 cm thick and 7.5 cm high. Calculate the density in kg/m³.",
        solution:
          "Volume = 5.0 × 2.0 × 7.5 = 75 cm³ = 75 × 10⁻⁶ m³. Mass = 187.5 g = 0.1875 kg. Density = 0.1875 / 75 × 10⁻⁶ = 2,500 kg/m³.",
      },
      {
        problem:
          "The density of concentrated sulphuric acid is 1.8 g/cm³. Calculate the volume of 3.1 kg of the acid.",
        solution: "Mass = 3,100 g. Volume = mass / density = 3,100 / 1.8 = 1,722 cm³.",
      },
      {
        problem:
          "100 cm³ of fresh water (density 1,000 kg/m³) is mixed with 100 cm³ of sea water (density 1,030 kg/m³). Find the density of the mixture.",
        solution:
          "Mass of fresh water = 1,000 × 0.0001 = 0.1 kg. Mass of sea water = 1,030 × 0.0001 = 0.103 kg. Total mass = 0.203 kg. Total volume = 0.0002 m³. Density = 0.203 / 0.0002 = 1,015 kg/m³.",
      },
    ],
  },
  {
    topicId: "p1-2",
    sections: [
      {
        heading: "States of Matter",
        content:
          "Matter exists in three states: solids, liquids, and gases. Matter can undergo physical changes (reversible, no new substance), chemical changes (irreversible, new substance formed), and nuclear changes (radioactive substances emit particles and transform).",
      },
      {
        heading: "Particle Model – Solids",
        content:
          "Individual atoms in solids have a small space between them. Forces of attraction are very strong. Particles vibrate in their fixed positions, giving solids a fixed shape and volume.",
      },
      {
        heading: "Particle Model – Liquids",
        content:
          "Forces of attraction between liquid molecules are not as strong as in solids. Particles move short distances and collide with each other. Liquids take the shape of their container but have a definite volume.",
      },
      {
        heading: "Particle Model – Gases",
        content:
          "Molecules in gases are far apart with very small forces of attraction. They are almost completely free of one another and move in rapid, random motion. Gases have no definite shape or volume — they fill their container completely.",
      },
      {
        heading: "Diffusion",
        content:
          "Diffusion is the movement of molecules from regions of high concentration to regions of low concentration until equilibrium is reached. Gases diffuse faster than liquids because their particles move more freely.",
      },
      {
        heading: "Brownian Motion",
        content:
          "Random, zigzag motion of small particles (e.g., smoke particles in air) caused by collisions with invisible air molecules. First observed by Robert Brown in 1827 with pollen grains in water. This is key evidence for the kinetic theory of matter.",
      },
      {
        heading: "Changes of State",
        content:
          "Melting: solid → liquid (absorbs heat). Boiling/Evaporation: liquid → gas (absorbs heat). Condensation: gas → liquid (releases heat). Freezing: liquid → solid (releases heat). Sublimation: solid → gas directly (e.g., dry ice, iodine crystals).",
      },
    ],
    examples: [
      {
        problem: "Explain why a drop of ink spreads in water even without stirring.",
        solution:
          "The ink molecules diffuse from a region of high concentration (the drop) to low concentration (the surrounding water). Water molecules also collide randomly with ink particles, spreading them throughout the liquid.",
      },
    ],
  },
  {
    topicId: "p1-3",
    sections: [
      {
        heading: "What is Force?",
        content:
          "Force is a push or a pull that changes a body's state of motion or shape. The SI unit is the Newton (N). Force is a vector quantity — it has both magnitude and direction.",
      },
      {
        heading: "Types of Forces",
        content:
          "1. Gravitational force – attraction between masses. 2. Friction – opposes relative motion. 3. Tension – pull in a string or spring. 4. Upthrust – upward force in a fluid. 5. Cohesive forces – between same molecules. 6. Adhesive forces – between different molecules. 7. Magnetic force. 8. Electrostatic force. 9. Centripetal force. 10. Surface tension.",
      },
      {
        heading: "Mass vs Weight",
        content:
          "Mass is the amount of matter (kg), constant everywhere, scalar. Weight is gravitational pull (N), changes with location, vector. W = mg where g ≈ 10 N/kg on Earth.",
      },
      {
        heading: "Hooke's Law",
        content:
          "The extension of a spring is directly proportional to the applied force, provided the elastic limit is not exceeded. F = ke, where k is the spring constant and e is the extension.",
      },
      {
        heading: "Pressure",
        content:
          "Pressure = Force / Area. SI unit: Pascal (Pa) = N/m². A smaller area produces greater pressure for the same force (e.g., sharp knife). A larger area reduces pressure (e.g., tractor tyres, snowshoes).",
      },
    ],
    examples: [
      {
        problem:
          "An astronaut weighs 900 N on Earth. On the Moon he weighs 150 N. Calculate the Moon's gravitational strength.",
        solution: "Mass = 900/10 = 90 kg. Moon's gravitational strength = 150/90 = 1.67 N/kg.",
      },
      {
        problem:
          "A spring has natural length 16.0 cm and stretches to 20.0 cm under a 5.0 N load. Find its length under 2.5 N.",
        solution:
          "5 N causes extension of 4.0 cm, so extension per newton = 0.8 cm. For 2.5 N: extension = 2.0 cm. Length = 16.0 + 2.0 = 18.0 cm.",
      },
    ],
  },
  {
    topicId: "p1-4",
    sections: [
      {
        heading: "Forms of Energy",
        content:
          "Energy exists in many forms: Kinetic (moving objects), Gravitational Potential (objects at height), Elastic Potential, Thermal/Heat, Light, Sound, Electrical, Chemical (in fuels, food, batteries), Nuclear, and Magnetic.",
      },
      {
        heading: "Conservation of Energy",
        content:
          "Energy cannot be created or destroyed — only transformed. The total energy in a closed system remains constant. Example: A falling ball converts PE → KE.",
      },
      {
        heading: "Kinetic and Potential Energy",
        content:
          "KE = ½mv². PE = mgh. At the top of a hill, PE is maximum and KE is zero. As you roll down, PE converts to KE.",
      },
      {
        heading: "Efficiency",
        content:
          "Efficiency = (useful energy output / total energy input) × 100%. No machine is 100% efficient.",
      },
      {
        heading: "Power",
        content: "Power = Energy / Time = Work / Time. SI unit: Watt (W). 1 kW = 1,000 W.",
      },
      {
        heading: "Energy Sources",
        content:
          "Renewable: solar, wind, hydroelectric, geothermal, biomass, tidal. Non-renewable: fossil fuels (coal, oil, gas), nuclear fuel (uranium).",
      },
    ],
    examples: [
      {
        problem:
          "A 60 kg person climbs a 5 m staircase in 10 seconds. Calculate the power developed.",
        solution: "Work = mgh = 60 × 10 × 5 = 3,000 J. Power = 3,000/10 = 300 W.",
      },
    ],
  },

  // ── PHYSICS S2 ──

  {
    topicId: "p2-1",
    sections: [
      {
        heading: "Speed, Velocity, Acceleration",
        content:
          "Speed = distance/time (scalar, m/s). Velocity = displacement/time (vector). Acceleration = (v − u)/t (m/s²). Deceleration is negative acceleration.",
      },
      {
        heading: "Equations of Motion (SUVAT)",
        content: "v = u + at. s = ut + ½at². v² = u² + 2as. s = ½(u + v)t.",
      },
      {
        heading: "Newton's Laws",
        content:
          "1st Law: A body remains at rest or in uniform motion unless acted on by a force. 2nd Law: F = ma. 3rd Law: Every action has an equal and opposite reaction.",
      },
      {
        heading: "Momentum",
        content:
          "Momentum p = mv (kg·m/s). Conservation: total momentum before = total momentum after in a closed system.",
      },
    ],
    examples: [
      {
        problem: "A car accelerates from 10 m/s to 30 m/s in 5 s. Find acceleration and distance.",
        solution: "a = (30 − 10)/5 = 4 m/s². s = ½(10 + 30) × 5 = 100 m.",
      },
    ],
  },
  {
    topicId: "p2-2",
    sections: [
      {
        heading: "Moment of a Force",
        content: "Moment = Force × perpendicular distance from pivot. Unit: Nm.",
      },
      {
        heading: "Principle of Moments",
        content: "For equilibrium: Sum of clockwise moments = Sum of anticlockwise moments.",
      },
      {
        heading: "Centre of Gravity",
        content:
          "The point where the entire weight appears to act. For uniform objects, it is at the geometric centre.",
      },
      {
        heading: "Stability",
        content:
          "Stable equilibrium: wide base, low centre of gravity. Unstable: narrow base, high centre of gravity. Neutral: centre of gravity doesn't change height when displaced.",
      },
    ],
    examples: [
      {
        problem:
          "A 2 m uniform beam weighing 100 N is supported at one end. A 50 N weight hangs 0.5 m from the support. Find the force at the support.",
        solution:
          "Taking moments about the free end: F × 2 = 100 × 1 + 50 × 1.5. F = 175/2 = 87.5 N upward. By equilibrium, the other support provides 100 + 50 − 87.5 = 62.5 N.",
      },
    ],
  },
  {
    topicId: "p2-3",
    sections: [
      {
        heading: "Pressure in Solids",
        content:
          "P = F/A. Increasing area decreases pressure (wide tyres). Decreasing area increases pressure (sharp pins).",
      },
      {
        heading: "Liquid Pressure",
        content:
          "P = ρgh. Pressure increases with depth and density. Acts equally in all directions at a given depth.",
      },
      {
        heading: "Atmospheric Pressure",
        content:
          "Weight of the atmosphere above us. About 101,325 Pa at sea level. Measured using barometers. Decreases with altitude.",
      },
      {
        heading: "Boyle's Law",
        content:
          "At constant temperature: P₁V₁ = P₂V₂. As pressure increases, volume decreases proportionally.",
      },
      {
        heading: "Hydraulic Systems",
        content:
          "Pascal's principle: pressure applied to a confined fluid is transmitted equally. F₁/A₁ = F₂/A₂. Used in hydraulic brakes, car jacks, and presses.",
      },
    ],
    examples: [
      {
        problem:
          "A diver is 20 m below the surface of a lake. Find the pressure due to water (density = 1,000 kg/m³).",
        solution: "P = ρgh = 1,000 × 10 × 20 = 200,000 Pa = 200 kPa.",
      },
    ],
  },
  {
    topicId: "p2-4",
    sections: [
      {
        heading: "Work Done",
        content:
          "Work = Force × distance moved in direction of force. W = Fd. SI unit: Joule (J). No work is done if there is no movement or the force is perpendicular to motion.",
      },
      {
        heading: "Power",
        content: "Power = Work / Time = Energy / Time. SI unit: Watt (W). 1 horsepower ≈ 746 W.",
      },
      {
        heading: "Machines",
        content:
          "Mechanical advantage (MA) = Load / Effort. Velocity ratio (VR) = distance moved by effort / distance moved by load. Efficiency = (MA/VR) × 100%.",
      },
      {
        heading: "Simple Machines",
        content:
          "Levers (3 classes), pulleys, inclined planes, wedges, screws, wheel and axle. Each multiplies force or changes direction of force.",
      },
    ],
    examples: [
      {
        problem:
          "A machine lifts a 500 N load through 2 m when an effort of 200 N moves through 6 m. Find MA, VR and efficiency.",
        solution: "MA = 500/200 = 2.5. VR = 6/2 = 3. Efficiency = (2.5/3) × 100% = 83.3%.",
      },
    ],
  },

  // ── PHYSICS S3 ──

  {
    topicId: "p3-1",
    sections: [
      {
        heading: "Current and Charge",
        content:
          "Current (I) is the rate of flow of charge. I = Q/t. SI unit: Ampere (A). Conventional current flows from positive to negative. Electron flow is opposite.",
      },
      {
        heading: "Ohm's Law",
        content:
          "V = IR. The current through a conductor is proportional to the potential difference across it, provided temperature remains constant.",
      },
      {
        heading: "Series and Parallel Circuits",
        content:
          "Series: same current through all, voltages add up, R_total = R₁ + R₂. Parallel: same voltage across all, currents add up, 1/R_total = 1/R₁ + 1/R₂.",
      },
      {
        heading: "Electrical Power and Energy",
        content:
          "P = IV = I²R = V²/R. Energy = Pt = VIt. Unit of energy: joule (J) or kilowatt-hour (kWh). 1 kWh = 3,600,000 J.",
      },
      {
        heading: "Safety",
        content:
          "Fuses, circuit breakers, earthing, and double insulation protect against electric shock and fire. Never handle electrical appliances with wet hands.",
      },
    ],
    examples: [
      {
        problem: "A 60 W bulb is used for 5 hours. Calculate the energy consumed in kWh.",
        solution: "Energy = P × t = 0.06 kW × 5 h = 0.3 kWh.",
      },
    ],
  },
  {
    topicId: "p3-2",
    sections: [
      {
        heading: "Properties of Magnets",
        content:
          "Magnets have north and south poles. Like poles repel, unlike poles attract. Magnetic materials include iron, steel, cobalt, and nickel.",
      },
      {
        heading: "Magnetic Field Patterns",
        content:
          "Lines of force go from North to South outside the magnet. Closer lines = stronger field. Earth has its own magnetic field.",
      },
      {
        heading: "Electromagnets",
        content:
          "A coil carrying current produces a magnetic field. Adding a soft iron core strengthens it. Applications: electric bells, relays, loudspeakers, circuit breakers.",
      },
      {
        heading: "Electromagnetic Induction",
        content:
          "A changing magnetic field induces an EMF in a conductor (Faraday's law). The direction opposes the change (Lenz's law). Applications: generators, transformers.",
      },
      {
        heading: "Transformers",
        content:
          "Step-up: increases voltage (more secondary turns). Step-down: decreases voltage. Vs/Vp = Ns/Np. For ideal transformer: VpIp = VsIs.",
      },
    ],
    examples: [
      {
        problem:
          "A transformer has 500 primary turns and 100 secondary turns. If the input voltage is 240 V, find the output.",
        solution: "Vs/Vp = Ns/Np → Vs = 240 × 100/500 = 48 V.",
      },
    ],
  },
  {
    topicId: "p3-3",
    sections: [
      {
        heading: "Heat Transfer",
        content:
          "Conduction: through solids (metals best). Convection: through fluids (hot rises, cold sinks). Radiation: through a vacuum (electromagnetic waves). Dark/rough surfaces absorb and emit better.",
      },
      {
        heading: "Specific Heat Capacity",
        content:
          "Q = mcΔθ. c is the energy needed to raise 1 kg by 1°C. Water has high c (4,200 J/kg°C) – good coolant.",
      },
      {
        heading: "Latent Heat",
        content:
          "Q = ml. Latent heat of fusion: energy to melt (solid → liquid) without temperature change. Latent heat of vaporisation: energy to boil (liquid → gas).",
      },
      {
        heading: "Thermal Expansion",
        content:
          "Most solids, liquids, and gases expand when heated. Applications: bimetallic strips (thermostats), expansion gaps in bridges and railways. Water is anomalous: it expands when cooled from 4°C to 0°C.",
      },
    ],
    examples: [
      {
        problem:
          "How much energy is needed to heat 2 kg of water from 20°C to 100°C? (c = 4,200 J/kg°C)",
        solution: "Q = mcΔθ = 2 × 4,200 × (100 - 20) = 672,000 J = 672 kJ.",
      },
    ],
  },
  {
    topicId: "p3-4",
    sections: [
      {
        heading: "Rectilinear Propagation of Light",
        content:
          "Light travels in straight lines. Evidence: shadows, eclipses, pinhole camera images.",
      },
      {
        heading: "Laws of Reflection",
        content:
          "1. The incident ray, normal, and reflected ray all lie in the same plane. 2. Angle of incidence = angle of reflection.",
      },
      {
        heading: "Refraction of Light",
        content:
          "Light bends when passing between media of different densities. Snell's law: n₁ sin i = n₂ sin r. Light bends towards the normal when entering a denser medium.",
      },
      {
        heading: "Total Internal Reflection",
        content:
          "Occurs when light travels from dense to less dense medium at angle > critical angle c. sin c = 1/n. Applications: optical fibres, periscopes.",
      },
      {
        heading: "Lenses",
        content:
          "Converging (convex): brings parallel rays to a focal point. Diverging (concave): spreads rays apart. Lens formula: 1/f = 1/u + 1/v. Magnification = v/u.",
      },
    ],
    examples: [
      {
        problem:
          "A ray of light passes from air into glass (n = 1.5) with angle of incidence 45°. Find angle of refraction.",
        solution: "sin r = sin 45° / 1.5 = 0.707 / 1.5 = 0.471. r = sin⁻¹(0.471) ≈ 28.1°.",
      },
    ],
  },

  // ── PHYSICS S4 ──

  {
    topicId: "p4-1",
    sections: [
      {
        heading: "Wave Properties",
        content:
          "Amplitude: max displacement. Wavelength (λ): distance between consecutive crests. Frequency (f): waves per second (Hz). Period T = 1/f. Speed: v = fλ.",
      },
      {
        heading: "Types of Waves",
        content:
          "Transverse: vibration perpendicular to direction (light, water). Longitudinal: vibration parallel (sound). Both carry energy without transporting matter.",
      },
      {
        heading: "Sound Waves",
        content:
          "Longitudinal, need a medium. Speed ≈ 340 m/s in air. Frequency = pitch. Amplitude = loudness. Echo: min distance 17 m.",
      },
      {
        heading: "Resonance and Doppler Effect",
        content:
          "Resonance: forced vibration at natural frequency → large amplitude. Doppler: approaching source = higher pitch, receding = lower pitch.",
      },
    ],
    examples: [
      {
        problem: "A sound wave has frequency 680 Hz and wavelength 0.5 m. Find the speed.",
        solution: "v = fλ = 680 × 0.5 = 340 m/s.",
      },
    ],
  },
  {
    topicId: "p4-2",
    sections: [
      {
        heading: "The Electromagnetic Spectrum",
        content:
          "Radio → Microwave → Infrared → Visible → Ultraviolet → X-ray → Gamma. All travel at c = 3 × 10⁸ m/s. All are transverse waves.",
      },
      {
        heading: "Properties and Uses",
        content:
          "Radio: broadcasting. Microwave: cooking, satellite. Infrared: heating, remote controls. Visible: sight. UV: sterilisation. X-ray: medical imaging. Gamma: cancer treatment.",
      },
      {
        heading: "Dangers",
        content:
          "UV: sunburn, skin cancer. X-ray/Gamma: cell damage, cancer. Protection: limit exposure, shielding.",
      },
    ],
    examples: [
      {
        problem: "Calculate the frequency of a radio wave with wavelength 300 m.",
        solution: "f = c/λ = 3 × 10⁸ / 300 = 1 × 10⁶ Hz = 1 MHz.",
      },
    ],
  },
  {
    topicId: "p4-3",
    sections: [
      {
        heading: "Atomic Structure",
        content:
          "Protons (+, nucleus), neutrons (neutral, nucleus), electrons (−, orbiting shells). Atomic number = protons. Mass number = protons + neutrons.",
      },
      {
        heading: "Radioactive Decay",
        content:
          "Alpha (α): helium nucleus, stopped by paper. Beta (β): fast electron, stopped by aluminium. Gamma (γ): EM wave, stopped by thick lead.",
      },
      {
        heading: "Half-Life",
        content: "Time for half the radioactive atoms to decay. A = A₀ × (½)^(t/t½).",
      },
      {
        heading: "Nuclear Fission and Fusion",
        content:
          "Fission: heavy nucleus splits → energy + neutrons. Fusion: light nuclei combine → enormous energy. Fusion powers the Sun.",
      },
      {
        heading: "Uses and Safety",
        content:
          "Medical tracers, cancer treatment, carbon dating. Safety: minimise exposure, maximise distance, use shielding.",
      },
    ],
    examples: [
      {
        problem: "A sample has half-life 8 days. What fraction remains after 24 days?",
        solution: "Half-lives = 24/8 = 3. Fraction = (½)³ = 1/8.",
      },
    ],
  },
  {
    topicId: "p4-4",
    sections: [
      {
        heading: "Semiconductors",
        content:
          "Conductivity between conductors and insulators. Silicon, germanium. Doping: N-type (extra electrons), P-type (extra holes).",
      },
      {
        heading: "Diodes and LEDs",
        content:
          "Diode: current in one direction only. LED: emits light when forward-biased. Rectification: converting AC to DC.",
      },
      {
        heading: "Logic Gates",
        content:
          "AND: output 1 if ALL inputs 1. OR: output 1 if ANY input 1. NOT: inverts. NAND, NOR, XOR.",
      },
      {
        heading: "Transistor as Switch",
        content:
          "Small base current switches larger collector current. Used in computers, amplifiers, sensors.",
      },
    ],
    examples: [
      {
        problem:
          "Design a circuit where a light comes on only when both switches A AND B are pressed.",
        solution:
          "Use an AND gate. Connect A to input 1, B to input 2. Output goes to LED. ON only when A = 1 AND B = 1.",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // CHEMISTRY (Expanded from uploaded booklet)
  // ═══════════════════════════════════════════

  // ── CHEMISTRY S1 ──

  {
    topicId: "c1-1",
    sections: [
      {
        heading: "What is Chemistry?",
        content:
          "Chemistry is the branch of science that deals with the structure, composition, properties and behaviour of matter. It is part of Physical Science along with Physics. Chemistry studies what substances are made of and how they interact.",
      },
      {
        heading: "States of Matter",
        content:
          "Solid: particles closely packed, fixed shape and volume, high density (e.g., ice, copper). Liquid: particles have some freedom, fixed volume but takes shape of container (e.g., water, mercury). Gas: particles free and far apart, no fixed shape or volume, fills entire container (e.g., oxygen, nitrogen).",
      },
      {
        heading: "Separation of Mixtures",
        content:
          "A mixture is two or more substances combined that can be separated by physical means. Methods include: Sorting/picking, Decantation (pouring liquid off settled solid), Filtration (sieving through porous material — residue stays, filtrate passes through), Skimming (scooping floating particles), Evaporation, Distillation, Fractional distillation, Chromatography, Sublimation, and Crystallisation.",
      },
      {
        heading: "Solutions and Suspensions",
        content:
          "A solvent is the liquid that dissolves another substance. A solute is the substance that dissolves. A solution is formed when a solute dissolves uniformly in a solvent. Water is the universal solvent. If a substance does not dissolve, it forms a suspension/precipitate. Immiscible liquids form layers (e.g., oil and water).",
      },
      {
        heading: "Alloys",
        content:
          "Alloys are uniform mixtures of two or more metals. Common alloys: Brass (copper + zinc), Bronze (copper + tin), Solder (lead + tin), Duralumin (aluminium + copper + magnesium), Steel (iron + carbon + manganese), Nichrome (nickel + chromium).",
      },
      {
        heading: "Laboratory Safety",
        content:
          "Enter the lab orderly. Never taste chemicals. Waft gas fumes — never inhale directly. Boil test tubes facing away from people. Wash skin contact with water immediately. Know fire extinguisher and first aid locations. Clean workstation after use.",
      },
      {
        heading: "Common Laboratory Apparatus",
        content:
          "For measuring volume: measuring cylinder, burette (accurate to 50 ml), pipette (exact volumes, 25 ml), volumetric flask, dropper. For measuring mass: beam balance, electronic balance. For heating: Bunsen burner (luminous flame = air holes closed, yellow, sooty; non-luminous = air holes open, blue, hotter). For holding: tripod stand, wire gauze, clamp stand, test tube holder. Funnels: filter funnel, thistle funnel, separating funnel.",
      },
      {
        heading: "Physical vs Chemical Changes",
        content:
          "Physical change: no new substance formed, reversible (e.g., melting ice, dissolving salt). Chemical change: new substance formed, usually irreversible (e.g., burning paper, rusting iron). Melting/freezing point of pure substances is constant. Boiling point depends on atmospheric pressure.",
      },
    ],
    examples: [
      {
        problem: "A mixture contains salt and sand. Describe how to separate them.",
        solution:
          "Add water to dissolve the salt. Filter to remove sand (residue). Evaporate the filtrate to obtain salt crystals.",
      },
      {
        problem: "Distinguish between luminous and non-luminous Bunsen burner flames.",
        solution:
          "Luminous flame: air holes closed, yellow, sooty (incomplete combustion), used for lighting. Non-luminous flame: air holes open, blue, hotter, steady (complete combustion), used for heating.",
      },
    ],
  },
  {
    topicId: "c1-2",
    sections: [
      {
        heading: "Acids",
        content:
          "Acids have pH < 7. Turn blue litmus red. React with metals to give salt + hydrogen. React with bases to give salt + water. Common acids: HCl (hydrochloric), H₂SO₄ (sulphuric), HNO₃ (nitric). Organic acids: citric acid (lemons), ethanoic acid (vinegar).",
      },
      {
        heading: "Bases and Alkalis",
        content:
          "Bases: metal oxides and hydroxides. Alkalis: soluble bases (pH > 7). Turn red litmus blue. Feel soapy. Common: NaOH (sodium hydroxide), Ca(OH)₂ (calcium hydroxide), NH₃(aq) (ammonia solution).",
      },
      {
        heading: "pH Scale and Indicators",
        content:
          "0-6: acidic (lower = stronger). 7: neutral. 8-14: alkaline (higher = stronger). Universal indicator shows colours: red (strong acid) → green (neutral) → purple (strong alkali). Other indicators: litmus, phenolphthalein (colourless in acid, pink in alkali), methyl orange (red in acid, yellow in alkali).",
      },
      {
        heading: "Neutralisation",
        content:
          "Acid + Base → Salt + Water. Example: HCl + NaOH → NaCl + H₂O. The salt name depends on the acid and base used: HCl → chloride salts, H₂SO₄ → sulphate salts, HNO₃ → nitrate salts.",
      },
    ],
    examples: [
      {
        problem: "Name the salt produced when sulphuric acid reacts with potassium hydroxide.",
        solution: "H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O. The salt is potassium sulphate.",
      },
    ],
  },
  {
    topicId: "c1-3",
    sections: [
      {
        heading: "Water Properties",
        content:
          "Boiling point: 100°C. Freezing point: 0°C. Water is a universal solvent. Test for water: turns anhydrous copper(II) sulphate from white to blue, or turns cobalt chloride paper from blue to pink.",
      },
      {
        heading: "Water Purification",
        content:
          "Steps: screening → sedimentation (heavy solids settle) → filtration (through sand and gravel) → chlorination (kills bacteria). Hard water contains dissolved calcium/magnesium compounds. Soft water lathers easily with soap. Temporary hardness removed by boiling. Permanent hardness removed by adding washing soda or using ion-exchange resin.",
      },
      {
        heading: "Hydrogen",
        content:
          "Lightest gas. Burns with a 'pop' sound (test). Produced by reacting metals with dilute acid (Zn + H₂SO₄ → ZnSO₄ + H₂). Used in making margarine (hydrogenation) and as rocket fuel. Collected by downward displacement of water.",
      },
    ],
    examples: [
      {
        problem: "Describe the test for water.",
        solution:
          "Add the liquid to anhydrous copper(II) sulphate. If it turns from white to blue, water is present. Alternatively, add to cobalt chloride paper — it turns from blue to pink.",
      },
    ],
  },
  {
    topicId: "c1-4",
    sections: [
      {
        heading: "Composition of Air",
        content:
          "Nitrogen: 78%. Oxygen: 21% (active part of air). Carbon dioxide: 0.03%. Noble gases: ~1%. Water vapour: variable. The active part of air supports combustion; the inactive part (mainly nitrogen) does not.",
      },
      {
        heading: "Determining Composition of Air",
        content:
          "Using a candle: burn a candle in a closed gas jar over water. The water rises by about 1/5 (≈20%) as oxygen is used up. Using heated copper turnings: pass air repeatedly over heated copper in a glass tube between two syringes. Volume decreases by about 20%. Copper turns from brown to black (CuO forms). Using alkaline pyrogallol: absorbs oxygen, reducing volume by ~20%.",
      },
      {
        heading: "Oxygen",
        content:
          "Supports combustion (relights a glowing splint — confirmatory test). Prepared by: decomposing hydrogen peroxide (2H₂O₂ → 2H₂O + O₂) using MnO₂ catalyst, or heating potassium chlorate(V) (2KClO₃ → 2KCl + 3O₂). Collected over water (slightly soluble). Uses: welding (oxy-acetylene at 3000°C), hospitals, mountaineering, rocket fuel.",
      },
      {
        heading: "Carbon Dioxide",
        content:
          "Does not support combustion (extinguishes burning splint). Test: turns lime water milky (white precipitate of CaCO₃). Excess CO₂ dissolves precipitate: CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂. Present in air at 0.03%. Produced by combustion, respiration, and reaction of acids with carbonates.",
      },
      {
        heading: "Combustion and Rusting",
        content:
          "Combustion requires fuel, oxygen, and heat (fire triangle). Complete: fuel + O₂ → CO₂ + H₂O. Incomplete: produces CO (toxic) and soot. Most non-metal oxides are acidic in water. Most metal oxides are basic/alkaline. Rusting requires iron, oxygen AND water. Prevention: painting, oiling, galvanising, alloying.",
      },
    ],
    examples: [
      {
        problem:
          "In an experiment, 158 cm³ of air is passed over heated copper. The final volume is 127.2 cm³. Calculate the % of oxygen.",
        solution: "Volume used = 158 - 127.2 = 30.8 cm³. % oxygen = (30.8/158) × 100 = 19.5%.",
      },
      {
        problem: "Write the equation for burning magnesium in air.",
        solution:
          "2Mg(s) + O₂(g) → 2MgO(s). Also: 3Mg(s) + N₂(g) → Mg₃N₂(s). Magnesium reacts with both oxygen and nitrogen because it is highly reactive.",
      },
    ],
  },

  // ── CHEMISTRY S2 ──

  {
    topicId: "c2-1",
    sections: [
      {
        heading: "Subatomic Particles",
        content:
          "Protons: positive charge, in nucleus, mass ≈ 1 amu. Neutrons: no charge, in nucleus, mass ≈ 1 amu. Electrons: negative charge, orbit nucleus in shells, mass ≈ 1/1836 amu (negligible). Atomic number (Z) = number of protons = number of electrons in a neutral atom. Mass number (A) = protons + neutrons.",
      },
      {
        heading: "Electron Configuration",
        content:
          "Electrons fill shells: 1st shell = max 2 electrons, 2nd shell = max 8, 3rd shell = max 8 (for first 20 elements). Example: Sodium (11) = 2, 8, 1. Chlorine (17) = 2, 8, 7. The number of outer electrons determines chemical properties and group number.",
      },
      {
        heading: "Isotopes",
        content:
          "Atoms of the same element with different numbers of neutrons. Same atomic number, different mass number. Example: Carbon-12 (6p + 6n) and Carbon-14 (6p + 8n). Isotopes have identical chemical properties but different physical properties (density, rate of diffusion).",
      },
      {
        heading: "Ions",
        content:
          "Atoms gain or lose electrons to achieve a stable noble gas configuration. Metals lose electrons → positive ions (cations): Na → Na⁺ + e⁻. Non-metals gain electrons → negative ions (anions): Cl + e⁻ → Cl⁻.",
      },
    ],
    examples: [
      {
        problem:
          "An atom has 11 protons and 12 neutrons. Identify the element and give its electron configuration.",
        solution:
          "Atomic number 11 = Sodium (Na). Mass number = 11 + 12 = 23. Electron config: 2, 8, 1.",
      },
    ],
  },
  {
    topicId: "c2-2",
    sections: [
      {
        heading: "Structure of the Periodic Table",
        content:
          "Rows = periods (number of electron shells). Columns = groups (electrons in outer shell). Group I: 1 outer electron (alkali metals). Group VII: 7 outer electrons (halogens). Group 0/VIII: full outer shell (noble gases — unreactive).",
      },
      {
        heading: "Group I – Alkali Metals",
        content:
          "Soft, low density, low melting points. Very reactive — reactivity increases down the group. React vigorously with water: 2Na + 2H₂O → 2NaOH + H₂. Stored under oil to prevent reaction with air and moisture.",
      },
      {
        heading: "Group VII – Halogens",
        content:
          "Diatomic molecules (F₂, Cl₂, Br₂, I₂). Reactivity decreases down the group (opposite to metals). A more reactive halogen displaces a less reactive one: Cl₂ + 2KBr → 2KCl + Br₂. Uses: chlorine for water purification, iodine as antiseptic.",
      },
      {
        heading: "Trends Across and Down",
        content:
          "Across a period: metallic character decreases, non-metallic increases. Down a group: metallic character increases, atomic size increases, melting point changes vary. Transition metals (middle block): hard, high melting points, form coloured compounds, variable valency.",
      },
    ],
  },
  {
    topicId: "c2-3",
    sections: [
      {
        heading: "Types of Reactions",
        content:
          "Combination/synthesis: A + B → AB (e.g., 2Mg + O₂ → 2MgO). Decomposition: AB → A + B (e.g., CaCO₃ → CaO + CO₂). Displacement: A + BC → AC + B (more reactive displaces less reactive). Double decomposition: AB + CD → AD + CB.",
      },
      {
        heading: "Balancing Chemical Equations",
        content:
          "Same number of each type of atom on both sides. Only change coefficients, never formulae. Steps: write unbalanced equation → balance metals → balance non-metals → balance hydrogen → balance oxygen. Example: 2H₂ + O₂ → 2H₂O.",
      },
      {
        heading: "Energy Changes in Reactions",
        content:
          "Exothermic: releases heat (temperature rises). Bond making releases energy. Examples: combustion, neutralisation, respiration. Endothermic: absorbs heat (temperature falls). Bond breaking requires energy. Examples: thermal decomposition, photosynthesis, dissolving ammonium nitrate.",
      },
    ],
    examples: [
      {
        problem: "Balance: Fe + O₂ → Fe₂O₃",
        solution: "4Fe + 3O₂ → 2Fe₂O₃. Check: 4 Fe on each side, 6 O on each side ✓",
      },
    ],
  },
  {
    topicId: "c2-4",
    sections: [
      {
        heading: "Properties of Metals",
        content:
          "Good conductors of heat and electricity. Malleable (can be hammered into sheets), ductile (can be drawn into wires). Generally high melting and boiling points. Shiny when polished (lustrous). Sonorous (ring when struck). Mercury is the only liquid metal at room temperature.",
      },
      {
        heading: "Reactivity Series",
        content:
          "K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag > Au (most to least reactive). Memory aid: King Nathan Came Marching And Zapped Intelligent Polar Bears Hunting Cute Silver Goldfish. Metals above hydrogen react with dilute acids to produce hydrogen gas.",
      },
      {
        heading: "Reactions of Metals",
        content:
          "With water: K, Na, Ca react vigorously. Mg reacts slowly with cold water but vigorously with steam. Zn and Fe react only with steam. Cu, Ag, Au do not react. With dilute acids: metals above hydrogen produce salt + H₂. With oxygen: most metals form metal oxides when heated.",
      },
      {
        heading: "Metal Extraction",
        content:
          "Very reactive metals (K → Al): extracted by electrolysis of molten compounds. Moderately reactive (Zn → Fe): reduction with carbon/coke in a blast furnace. Least reactive (Cu → Au): found native or extracted by simple heating/roasting.",
      },
    ],
    examples: [
      {
        problem: "Predict what happens when zinc is added to copper sulphate solution.",
        solution:
          "Zinc is more reactive than copper, so it displaces copper: Zn + CuSO₄ → ZnSO₄ + Cu. Blue solution turns colourless and brown copper deposits form.",
      },
    ],
  },

  // ── CHEMISTRY S3 ──

  {
    topicId: "c3-1",
    sections: [
      {
        heading: "Ionic Bonding",
        content:
          "Transfer of electrons from metal to non-metal. Metal forms positive ion (cation), non-metal forms negative ion (anion). Strong electrostatic attraction between ions. Example: NaCl — Na loses 1e⁻ → Na⁺, Cl gains 1e⁻ → Cl⁻. Ionic compounds: high melting points, conduct electricity when molten or in solution, form crystal lattices.",
      },
      {
        heading: "Covalent Bonding",
        content:
          "Sharing of electron pairs between non-metal atoms. Single bond: 1 shared pair. Double bond: 2 shared pairs. Triple bond: 3 shared pairs. Example: H₂O — each H shares 1 electron with O. Covalent compounds: low melting points, don't conduct electricity, often gases or liquids.",
      },
      {
        heading: "Metallic Bonding",
        content:
          "Metal atoms lose outer electrons to form a 'sea' of delocalised electrons. These electrons are free to move, allowing conduction of electricity and heat. Metallic bonds are strong, giving metals high melting points and making them malleable and ductile.",
      },
      {
        heading: "Dot-and-Cross Diagrams",
        content:
          "Show only outer shell electrons. Dots for one atom, crosses for the other. For ionic: show transfer and charge on ions. For covalent: show shared pairs in the overlap region. Examples to practise: NaCl, MgO, H₂O, CO₂, NH₃, CH₄.",
      },
    ],
  },
  {
    topicId: "c3-2",
    sections: [
      {
        heading: "The Mole",
        content:
          "1 mole = 6.02 × 10²³ particles (Avogadro's number). Moles = mass / Mr (relative formula mass). For gases at RTP: 1 mole occupies 24 dm³ (24,000 cm³). Molar mass = Mr in grams.",
      },
      {
        heading: "Concentration",
        content:
          "Concentration = moles / volume (in dm³). Units: mol/dm³. To convert cm³ to dm³: divide by 1000. Concentration in g/dm³ = concentration in mol/dm³ × Mr.",
      },
      {
        heading: "Reacting Masses",
        content:
          "Use the balanced equation to find the mole ratio. Calculate moles of what you know, use ratio to find moles of what you need, then convert to mass or volume.",
      },
      {
        heading: "Empirical and Molecular Formula",
        content:
          "Empirical formula: simplest whole-number ratio. Steps: % → mass → ÷ Ar → ÷ smallest → ratio. Molecular formula: actual numbers. Molecular formula = (empirical formula) × n, where n = Mr / empirical formula mass.",
      },
    ],
    examples: [
      {
        problem: "Find the number of moles in 44 g of CO₂ (Mr = 44).",
        solution: "Moles = mass/Mr = 44/44 = 1 mole.",
      },
      {
        problem: "What volume does 2 moles of gas occupy at RTP?",
        solution: "Volume = moles × 24 = 2 × 24 = 48 dm³.",
      },
    ],
  },
  {
    topicId: "c3-3",
    sections: [
      {
        heading: "Neutralisation Reactions",
        content:
          "Acid + Base → Salt + Water. Acid + Metal → Salt + Hydrogen. Acid + Carbonate → Salt + Water + CO₂. The type of salt depends on which acid is used: HCl → chlorides, H₂SO₄ → sulphates, HNO₃ → nitrates.",
      },
      {
        heading: "Preparing Soluble Salts",
        content:
          "Method 1: Add excess insoluble base/metal/carbonate to warm acid. Filter off excess. Evaporate slowly to crystallise. Method 2: Titration — add exact amount of alkali to acid using a burette and indicator.",
      },
      {
        heading: "Preparing Insoluble Salts",
        content:
          "Precipitation: mix two soluble salts whose combination produces an insoluble product. Filter the precipitate, wash with distilled water, dry. Example: NaCl(aq) + AgNO₃(aq) → AgCl(s) + NaNO₃(aq).",
      },
      {
        heading: "Titration",
        content:
          "A method to find the exact volume of acid to neutralise a known volume of alkali (or vice versa). Use indicator (methyl orange or phenolphthalein) to find the end point. Read burette before and after. Repeat for concordant results (within 0.1 cm³).",
      },
    ],
  },
  {
    topicId: "c3-4",
    sections: [
      {
        heading: "Electrolysis Basics",
        content:
          "Passing electric current through a molten or dissolved ionic compound to decompose it. Electrolyte: ionic compound (molten or in solution) that conducts. Non-electrolyte: does not conduct (e.g., sugar solution). Electrodes: anode (+) and cathode (−). Direct current (DC) must be used.",
      },
      {
        heading: "At the Electrodes",
        content:
          "Cathode (negative): positive ions (cations) gain electrons — REDUCTION. Anode (positive): negative ions (anions) lose electrons — OXIDATION. Remember: OILRIG (Oxidation Is Loss, Reduction Is Gain) or AN OX RED CAT.",
      },
      {
        heading: "Electrolysis of Solutions",
        content:
          "In aqueous solutions, water provides H⁺ and OH⁻ ions. At cathode: if metal is less reactive than hydrogen, metal is deposited. If more reactive, hydrogen gas is produced. At anode: if halide ion present, halogen is produced. Otherwise, oxygen is produced.",
      },
      {
        heading: "Applications",
        content:
          "Electroplating: coating objects with a thin layer of metal (object = cathode, plating metal = anode, solution = salt of plating metal). Extraction of aluminium from bauxite using cryolite to lower melting point. Purification of copper: impure copper anode, pure copper cathode, CuSO₄ solution.",
      },
    ],
    examples: [
      {
        problem: "During electrolysis of molten NaCl, what forms at each electrode?",
        solution:
          "Cathode: Na⁺ + e⁻ → Na (sodium metal deposited). Anode: 2Cl⁻ → Cl₂ + 2e⁻ (chlorine gas produced).",
      },
    ],
  },

  // ── CHEMISTRY S4 ──

  {
    topicId: "c4-1",
    sections: [
      {
        heading: "Alkanes",
        content:
          "General formula CₙH₂ₙ₊₂. Saturated hydrocarbons (single C-C bonds only). First four: methane CH₄, ethane C₂H₆, propane C₃H₈, butane C₄H₁₀. Undergo substitution reactions (e.g., with halogens in UV light). Used as fuels. Obtained from fractional distillation of crude oil.",
      },
      {
        heading: "Alkenes",
        content:
          "General formula CₙH₂ₙ. Unsaturated (contain C=C double bond). First: ethene C₂H₄, propene C₃H₆. Undergo addition reactions. Test: decolourise bromine water (orange → colourless). Used to make polymers (polyethene).",
      },
      {
        heading: "Alcohols and Carboxylic Acids",
        content:
          "Alcohols contain -OH group. Methanol CH₃OH, Ethanol C₂H₅OH. Ethanol made by fermentation (glucose + yeast) or hydration of ethene. Carboxylic acids contain -COOH group. Ethanoic acid CH₃COOH (vinegar). Weak acids. React with alcohols to form esters (fruity smell).",
      },
      {
        heading: "Naming (IUPAC)",
        content:
          "Count longest carbon chain (meth-1, eth-2, prop-3, but-4, pent-5). Add suffix: -ane (alkane), -ene (alkene), -ol (alcohol), -oic acid. Number position of functional group from nearest end.",
      },
      {
        heading: "Polymers",
        content:
          "Addition polymers: monomers with C=C join without losing atoms (e.g., polyethene, PVC, polystyrene). Condensation polymers: monomers join with loss of small molecule like water (e.g., nylon, polyester, proteins). Plastics: most are non-biodegradable — environmental concern.",
      },
      {
        heading: "Fractional Distillation of Crude Oil",
        content:
          "Crude oil is heated in a furnace. Vapours rise up a fractionating column. Different fractions condense at different heights based on boiling point. Short chains: low boiling point, very flammable, low viscosity (e.g., petrol). Long chains: high boiling point, viscous (e.g., bitumen). Cracking: breaking long chains into shorter, more useful ones using heat and catalyst.",
      },
    ],
    examples: [
      {
        problem: "Draw the structural formula of propene and state its molecular formula.",
        solution:
          "Molecular formula: C₃H₆. Structure: CH₂=CH-CH₃. It has a double bond between carbon 1 and carbon 2.",
      },
    ],
  },
  {
    topicId: "c4-2",
    sections: [
      {
        heading: "Collision Theory",
        content:
          "For a reaction to happen, particles must collide with enough energy (≥ activation energy) and in the correct orientation. Not all collisions lead to reactions — only those with sufficient energy (successful/effective collisions).",
      },
      {
        heading: "Factors Affecting Rate",
        content:
          "Temperature ↑: particles move faster, more frequent and more energetic collisions. Concentration ↑: more particles per volume, more frequent collisions. Surface area ↑: more exposed particles available to collide (powder reacts faster than lumps). Catalyst: provides alternative pathway with lower activation energy — not used up.",
      },
      {
        heading: "Measuring Rate of Reaction",
        content:
          "Rate = change in amount / time. Methods: (1) Measure gas volume produced using gas syringe over time. (2) Mass loss — place on balance, record mass at intervals. (3) Disappearing cross — time for precipitate to obscure a cross underneath. (4) Colour change using colorimeter.",
      },
      {
        heading: "Catalysts",
        content:
          "A catalyst speeds up a reaction without being chemically changed. It provides an alternative reaction pathway with lower activation energy. Examples: MnO₂ for decomposition of H₂O₂, iron for Haber process, vanadium(V) oxide for Contact process. Enzymes are biological catalysts.",
      },
    ],
    examples: [
      {
        problem: "Explain why powdered marble reacts faster with acid than marble chips.",
        solution:
          "Powder has a much larger surface area than chips. More marble particles are exposed to the acid. This means more collisions per second between acid and marble particles, so the reaction rate is faster.",
      },
    ],
  },
  {
    topicId: "c4-3",
    sections: [
      {
        heading: "Exothermic Reactions",
        content:
          "Release energy to surroundings (ΔH < 0). Temperature rises. Energy is released when bonds form. Products have less energy than reactants. Energy level diagram: products lower than reactants. Examples: combustion, neutralisation, respiration, dissolving concentrated H₂SO₄.",
      },
      {
        heading: "Endothermic Reactions",
        content:
          "Absorb energy from surroundings (ΔH > 0). Temperature falls. Energy is required to break bonds. Products have more energy than reactants. Energy level diagram: products higher than reactants. Examples: photosynthesis, thermal decomposition of CaCO₃, dissolving NH₄NO₃.",
      },
      {
        heading: "Bond Energy Calculations",
        content:
          "Energy to break all bonds in reactants (endothermic) minus energy released forming all bonds in products (exothermic) = ΔH. If more energy released than absorbed → exothermic. If more absorbed → endothermic.",
      },
      {
        heading: "Fuel Energy Values",
        content:
          "Different fuels release different amounts of energy per gram. Hydrogen: 143 kJ/g (highest). Methane: 56 kJ/g. Ethanol: 30 kJ/g. Measured using calorimetry: Q = mcΔT.",
      },
    ],
  },
  {
    topicId: "c4-4",
    sections: [
      {
        heading: "Reversible Reactions",
        content:
          "Products can react to re-form reactants. Written with ⇌ symbol. Forward and reverse reactions happen simultaneously. Example: N₂ + 3H₂ ⇌ 2NH₃ (Haber process). Heating hydrated copper sulphate: CuSO₄·5H₂O ⇌ CuSO₄ + 5H₂O (blue ⇌ white).",
      },
      {
        heading: "Dynamic Equilibrium",
        content:
          "Reached in a closed system when rate of forward reaction = rate of reverse reaction. Concentrations remain constant but reactions continue in both directions. Cannot be achieved in an open system because products escape.",
      },
      {
        heading: "Le Chatelier's Principle",
        content:
          "If a system at equilibrium is disturbed, it shifts to oppose the change. Increase concentration of reactant → shifts forward. Increase temperature → shifts in endothermic direction. Increase pressure → shifts to side with fewer gas moles. Catalysts do NOT affect equilibrium position — they only help reach equilibrium faster.",
      },
      {
        heading: "Industrial Applications",
        content:
          "Haber process (NH₃): N₂ + 3H₂ ⇌ 2NH₃. Conditions: 450°C, 200 atm, iron catalyst. Compromise between rate and yield. Contact process (H₂SO₄): 2SO₂ + O₂ ⇌ 2SO₃. Conditions: 450°C, 1-2 atm, V₂O₅ catalyst.",
      },
    ],
    examples: [
      {
        problem: "The Haber process is exothermic. Why isn't a very low temperature used?",
        solution:
          "Although low temperature favours the forward reaction (higher yield), the rate would be too slow. A compromise temperature of 450°C gives a reasonable rate with acceptable yield. An iron catalyst also helps speed up the reaction.",
      },
    ],
  },

  // ═══════════════════════════════════════════
  // BIOLOGY
  // ═══════════════════════════════════════════

  // ── BIOLOGY S1 ──

  {
    topicId: "b1-1",
    sections: [
      {
        heading: "Cell Structure",
        content:
          "All living things are made of cells. A cell has: cell membrane (controls what enters/leaves), cytoplasm (where reactions occur), nucleus (contains DNA, controls cell activities).",
      },
      {
        heading: "Plant vs Animal Cells",
        content:
          "Both have: membrane, cytoplasm, nucleus, mitochondria, ribosomes. Plant cells ALSO have: cell wall (cellulose, for support), chloroplasts (for photosynthesis), large vacuole (contains cell sap).",
      },
      {
        heading: "Key Organelles",
        content:
          "Mitochondria: site of respiration ('powerhouse'). Ribosomes: site of protein synthesis. Chloroplasts: contain chlorophyll for photosynthesis (plants only).",
      },
      {
        heading: "Levels of Organisation",
        content:
          "Cell → Tissue (group of similar cells) → Organ (group of tissues) → Organ system (group of organs) → Organism.",
      },
      {
        heading: "Microscopy",
        content:
          "Magnification = image size / actual size. Light microscope: magnifies up to ×1500. Electron microscope: magnifies up to ×500,000.",
      },
    ],
  },
  {
    topicId: "b1-2",
    sections: [
      {
        heading: "Characteristics of Life (MRS GREN)",
        content:
          "Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition. All living organisms show these characteristics.",
      },
      {
        heading: "Five Kingdoms",
        content:
          "Animalia: multicellular, no cell wall, heterotrophic. Plantae: multicellular, cell wall, autotrophic. Fungi: cell wall (chitin), saprophytic. Protista: mostly unicellular. Prokaryotae: no nucleus (bacteria).",
      },
      {
        heading: "Vertebrate Groups",
        content:
          "Fish: gills, scales, cold-blooded. Amphibians: moist skin, cold-blooded. Reptiles: dry scaly skin, cold-blooded. Birds: feathers, warm-blooded. Mammals: hair/fur, warm-blooded, produce milk.",
      },
      {
        heading: "Binomial Nomenclature",
        content:
          "Two-part Latin name: Genus + species. Written in italics. Genus capitalised, species lowercase. Example: Homo sapiens.",
      },
    ],
  },
  {
    topicId: "b1-3",
    sections: [
      {
        heading: "Photosynthesis",
        content:
          "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (in the presence of light and chlorophyll). Takes place in chloroplasts. Converts light energy to chemical energy (glucose).",
      },
      {
        heading: "Factors Affecting Photosynthesis",
        content:
          "Light intensity: more light → faster rate (up to a point). CO₂ concentration. Temperature. Water availability. The slowest factor is the limiting factor.",
      },
      {
        heading: "Leaf Structure",
        content:
          "Upper epidermis: transparent, allows light through. Palisade layer: packed with chloroplasts for photosynthesis. Spongy mesophyll: air spaces for gas exchange. Stomata: pores for gas exchange (controlled by guard cells).",
      },
      {
        heading: "Mineral Nutrition",
        content:
          "Nitrates: for making proteins. Phosphates: for DNA and energy transfer. Potassium: for enzyme function. Magnesium: for chlorophyll.",
      },
    ],
  },
  {
    topicId: "b1-4",
    sections: [
      {
        heading: "Food Groups",
        content:
          "Carbohydrates: energy source (starch, glucose). Proteins: growth and repair (amino acids). Fats: energy store and insulation. Vitamins and minerals: needed in small amounts for health. Water and fibre.",
      },
      {
        heading: "Balanced Diet",
        content:
          "Contains all food groups in correct proportions. Needs vary by age, activity level, and health. In Uganda: common staples include matooke, posho, beans, groundnuts, and greens.",
      },
      {
        heading: "Food Tests",
        content:
          "Starch: iodine solution → blue-black. Glucose: Benedict's solution + heat → orange/red. Protein: Biuret reagent → purple/violet. Fat: rub on paper → translucent spot.",
      },
      {
        heading: "Digestion",
        content:
          "Mechanical: teeth break food into smaller pieces. Chemical: enzymes break down large molecules. Amylase: starch → maltose. Protease: protein → amino acids. Lipase: fats → fatty acids + glycerol.",
      },
    ],
  },

  // ── BIOLOGY S2 ──

  {
    topicId: "b2-1",
    sections: [
      {
        heading: "Digestive System",
        content:
          "Mouth → Oesophagus → Stomach → Small intestine (duodenum, ileum) → Large intestine → Rectum → Anus. Enzymes at each stage break down specific nutrients.",
      },
      {
        heading: "Circulatory System",
        content:
          "Double circulatory system: heart → lungs (pulmonary) and heart → body (systemic). Heart has 4 chambers: left/right atria and ventricles. Arteries carry blood away from heart, veins carry blood to heart, capillaries exchange substances.",
      },
      {
        heading: "Blood Components",
        content:
          "Red blood cells: carry oxygen (haemoglobin). White blood cells: fight infection. Platelets: clotting. Plasma: liquid carrying dissolved substances.",
      },
      {
        heading: "Respiratory System",
        content:
          "Air path: nose → trachea → bronchi → bronchioles → alveoli. Gas exchange in alveoli: O₂ into blood, CO₂ out. Alveoli have thin walls, large surface area, rich blood supply.",
      },
    ],
  },
  {
    topicId: "b2-2",
    sections: [
      {
        heading: "Water Uptake",
        content:
          "Root hair cells absorb water by osmosis (water moves from high to low water concentration). Minerals absorbed by active transport.",
      },
      {
        heading: "Xylem and Phloem",
        content:
          "Xylem: transports water and minerals UP from roots (dead cells, thick walls). Phloem: transports sugars UP and DOWN (living cells). This is translocation.",
      },
      {
        heading: "Transpiration",
        content:
          "Loss of water vapour from leaves through stomata. Creates a 'pull' that draws water up. Factors: temperature, humidity, wind speed, light intensity.",
      },
    ],
  },
  {
    topicId: "b2-3",
    sections: [
      {
        heading: "What is Excretion?",
        content:
          "Removal of metabolic waste products from the body. NOT the same as egestion (removal of undigested food).",
      },
      {
        heading: "The Kidney",
        content:
          "Filters blood to remove urea, excess water, and salts. Each kidney contains about 1 million nephrons. Process: ultrafiltration → selective reabsorption → urine formation.",
      },
      {
        heading: "Liver Functions",
        content:
          "Deamination of excess amino acids (produces urea). Detoxification. Bile production. Storage of glycogen, vitamins, and iron.",
      },
    ],
  },
  {
    topicId: "b2-4",
    sections: [
      {
        heading: "Flower Structure",
        content:
          "Sepals: protect the bud. Petals: attract pollinators. Stamens (anther + filament): male part, produce pollen. Carpel (stigma + style + ovary): female part, contains ovules.",
      },
      {
        heading: "Pollination",
        content:
          "Transfer of pollen from anther to stigma. Self-pollination: same plant. Cross-pollination: different plants (by wind or insects).",
      },
      {
        heading: "Fertilisation and Seed Formation",
        content:
          "Pollen tube grows down style to ovule. Male nucleus fuses with female nucleus. Ovule → seed. Ovary → fruit.",
      },
      {
        heading: "Asexual Reproduction",
        content:
          "One parent, offspring genetically identical (clones). Methods: runners, tubers, bulbs, stem cuttings.",
      },
    ],
  },

  // ── BIOLOGY S3 ──

  {
    topicId: "b3-1",
    sections: [
      {
        heading: "Ecosystems",
        content:
          "An ecosystem includes all living organisms (community) and non-living factors (habitat). Biotic factors: predation, competition, disease. Abiotic factors: temperature, light, water, pH.",
      },
      {
        heading: "Food Chains and Webs",
        content:
          "Producer → Primary consumer → Secondary consumer → Tertiary consumer. Energy decreases at each level (~10% transferred). Pyramids of numbers, biomass, and energy.",
      },
      {
        heading: "Nutrient Cycles",
        content:
          "Carbon cycle: photosynthesis removes CO₂, respiration and combustion release CO₂. Nitrogen cycle: nitrogen-fixing bacteria → nitrates → plants → animals → decomposers.",
      },
      {
        heading: "Conservation",
        content:
          "Protecting habitats and species. Methods: national parks, seed banks, captive breeding. In Uganda: Bwindi (gorillas), Queen Elizabeth National Park.",
      },
    ],
  },
  {
    topicId: "b3-2",
    sections: [
      {
        heading: "Nervous System",
        content:
          "CNS = brain + spinal cord. Sensory neurones carry impulses TO the CNS. Motor neurones carry impulses FROM the CNS. Relay neurones connect them.",
      },
      {
        heading: "Reflex Arc",
        content:
          "Stimulus → Receptor → Sensory neurone → Relay neurone → Motor neurone → Effector → Response. Reflexes are fast, automatic, protective.",
      },
      {
        heading: "Hormones",
        content:
          "Chemical messengers in blood. Slower but longer-lasting than nerves. Insulin: lowers blood sugar. Adrenaline: fight or flight.",
      },
      {
        heading: "Homeostasis",
        content:
          "Maintaining constant internal environment. Examples: body temperature (37°C), blood sugar, water balance. Uses negative feedback.",
      },
    ],
  },
  {
    topicId: "b3-3",
    sections: [
      {
        heading: "Male Reproductive System",
        content:
          "Testes: produce sperm and testosterone. Sperm duct carries sperm. Prostate gland adds fluid to make semen.",
      },
      {
        heading: "Female Reproductive System",
        content:
          "Ovaries: produce eggs and hormones. Oviducts: where fertilisation occurs. Uterus: where embryo develops.",
      },
      {
        heading: "Menstrual Cycle",
        content:
          "About 28 days. Day 1-5: menstruation. Day 6-13: lining builds up. Day 14: ovulation. Day 15-28: lining maintained.",
      },
      {
        heading: "Pregnancy",
        content:
          "Fertilised egg implants in uterus. Placenta exchanges O₂, nutrients, waste. Gestation ≈ 9 months.",
      },
    ],
  },
  {
    topicId: "b3-4",
    sections: [
      {
        heading: "Aerobic Respiration",
        content:
          "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy. In mitochondria. Requires oxygen. Releases large amount of energy.",
      },
      {
        heading: "Anaerobic Respiration",
        content:
          "In animals: glucose → lactic acid + some energy. In yeast: glucose → ethanol + CO₂ + energy (fermentation).",
      },
      {
        heading: "Comparison",
        content:
          "Aerobic: needs O₂, more energy, produces CO₂ + H₂O. Anaerobic: no O₂, less energy, produces lactic acid or ethanol.",
      },
    ],
  },

  // ── BIOLOGY S4 ──

  {
    topicId: "b4-1",
    sections: [
      {
        heading: "DNA",
        content:
          "Double helix structure. Made of nucleotides (sugar + phosphate + base). Bases: A-T, G-C (complementary base pairing). DNA carries genetic information.",
      },
      {
        heading: "Genetics Terms",
        content:
          "Gene: section of DNA coding for a protein. Allele: different versions. Genotype: alleles an organism has (e.g., Tt). Phenotype: physical characteristic. Dominant: expressed with one copy. Recessive: needs two copies.",
      },
      {
        heading: "Genetic Crosses",
        content:
          "Use Punnett squares. Monohybrid: Tt × Tt gives 1TT : 2Tt : 1tt (3:1 phenotype ratio). Test cross: cross with homozygous recessive to find unknown genotype.",
      },
      {
        heading: "Natural Selection and Evolution",
        content:
          "Variation exists in a population. Those with advantageous traits survive and reproduce more. Over many generations, the population evolves.",
      },
    ],
  },
  {
    topicId: "b4-2",
    sections: [
      {
        heading: "Genetic Engineering",
        content:
          "Cutting a gene from one organism and inserting it into another using restriction enzymes and ligase. Used to produce human insulin in bacteria.",
      },
      {
        heading: "Selective Breeding",
        content:
          "Choosing parents with desired traits to breed. Over generations, the desired trait becomes more common. Used for crops and livestock.",
      },
      {
        heading: "Fermentation in Industry",
        content:
          "Yeast ferments sugar to make bread (CO₂ makes it rise), beer (ethanol), and yoghurt (lactic acid bacteria).",
      },
      {
        heading: "Ethical Considerations",
        content:
          "GM foods: benefits (higher yield, pest resistance) vs concerns (unknown long-term effects). Cloning: useful in medicine but raises ethical questions about human cloning.",
      },
    ],
  },
  {
    topicId: "b4-3",
    sections: [
      {
        heading: "Pathogens",
        content:
          "Bacteria: treated with antibiotics. Viruses: cannot be treated with antibiotics. Fungi: cause athlete's foot, ringworm. Protists: cause malaria (Plasmodium).",
      },
      {
        heading: "Body's Defences",
        content:
          "First line: skin, mucus, stomach acid. Second line: phagocytes (engulf pathogens). Third line: lymphocytes produce specific antibodies and antitoxins.",
      },
      {
        heading: "Vaccination",
        content:
          "Injecting a dead/weakened form of pathogen. Immune system produces antibodies and memory cells. If exposed again, response is faster and stronger.",
      },
      {
        heading: "HIV/AIDS",
        content:
          "HIV attacks helper T-cells (immune system). Transmitted through body fluids. Leads to AIDS (immune system too weak to fight infections). No cure, but antiretroviral drugs slow progression.",
      },
    ],
  },
  {
    topicId: "b4-4",
    sections: [
      {
        heading: "Deforestation",
        content:
          "Clearing forests for farming, timber, building. Consequences: loss of biodiversity, soil erosion, increased CO₂, disrupted water cycle.",
      },
      {
        heading: "Pollution",
        content:
          "Air: CO₂ (greenhouse effect), SO₂ (acid rain), smoke. Water: sewage, fertilisers (eutrophication), industrial waste. Land: landfill, pesticides.",
      },
      {
        heading: "Global Warming",
        content:
          "Greenhouse gases (CO₂, CH₄) trap heat in atmosphere. Consequences: rising sea levels, extreme weather, habitat loss. Solutions: renewable energy, reduce emissions.",
      },
      {
        heading: "Conservation",
        content:
          "Sustainable development: meeting present needs without compromising future. Methods: recycling, reforestation, protected areas, sustainable fishing and farming.",
      },
    ],
  },
  // ── ECONOMICS (S5-S6) ──
  {
    topicId: "ec5-1",
    sections: [
      {
        heading: "The Basic Economic Problem",
        content:
          "Economics studies how society manages its scarce resources. The fundamental economic problem is scarcity, where human wants are infinite but resources are limited.",
      },
      {
        heading: "Choice and Opportunity Cost",
        content:
          "Because resources are scarce, choices must be made. Choosing one alternative means giving up another. Opportunity cost is the value of the next best alternative forgone.",
      },
      {
        heading: "Production Possibility Curve (PPC)",
        content:
          "A PPC shows the maximum combination of two goods an economy can produce when all resources are fully and efficiently employed.",
      },
    ],
    examples: [
      {
        problem:
          "A student spends 2 hours studying instead of sleeping. What is the opportunity cost?",
        solution:
          "The opportunity cost is the rest and physical benefit of those 2 hours of sleep.",
      },
    ],
  },
  {
    topicId: "ec5-2",
    sections: [
      {
        heading: "Law of Demand and Supply",
        content:
          "The Law of Demand states that as price rises, quantity demanded falls, ceteris paribus. The Law of Supply states that as price rises, quantity supplied increases, ceteris paribus.",
      },
      {
        heading: "Market Equilibrium",
        content:
          "Market equilibrium occurs where the quantity demanded by consumers exactly equals the quantity supplied by producers. This determines the market price.",
      },
    ],
    examples: [
      {
        problem:
          "If price of sugar rises from 3,000 to 3,600 UGX, and demand falls by 10%, calculate Price Elasticity of Demand.",
        solution: "% Change in Price = (600/3000)*100 = 20%. Ed = -10%/20% = -0.5 (Inelastic).",
      },
    ],
  },
  {
    topicId: "ec6-1",
    sections: [
      {
        heading: "National Income Concepts",
        content:
          "National Income is the total value of all goods and services produced in a country over a specific period. GDP measures output within a country's borders, while GNP includes net income from abroad.",
      },
      {
        heading: "Calculation Methods",
        content:
          "National Income is measured in three equivalent ways: the Income Method (summing incomes), Output Method (summing value added), and Expenditure Method (C + I + G + X - M).",
      },
    ],
    examples: [
      {
        problem: "Calculate GDP given C=50M, I=20M, G=15M, X=10M, M=8M.",
        solution: "GDP = 50 + 20 + 15 + (10 - 8) = 87M.",
      },
    ],
  },
  // ── ICT (S1-S5) ──
  {
    topicId: "ict1-1",
    sections: [
      {
        heading: "Introduction to Computers",
        content:
          "A computer is an electronic device that inputs raw data, processes it according to specific instructions, stores it, and outputs the resulting information.",
      },
      {
        heading: "Computer Hardware Components",
        content:
          "Hardware includes physical components: Input devices (Keyboard, Mouse), Processing unit (CPU), Output devices (Monitor, Printer), and Storage (RAM, Hard Drive).",
      },
    ],
  },
  {
    topicId: "ict2-1",
    sections: [
      {
        heading: "Word Processing Basics",
        content:
          "Word processors allow users to create, format, edit, and print text-based documents. Typical tasks include formatting font size, margins, alignment, and spacing.",
      },
      {
        heading: "Mail Merge Utility",
        content:
          "Mail Merge is a powerful tool that allows users to create personalized letters or certificates for multiple recipients by combining a main document with a data source.",
      },
    ],
  },
  {
    topicId: "ict5-1",
    sections: [
      {
        heading: "Spreadsheets & Cell References",
        content:
          "Spreadsheets organize numerical data into rows and columns. Relative cell references (A1) adjust when copied, whereas Absolute references ($A$1) remain constant.",
      },
      {
        heading: "Standard Functions",
        content:
          "Use functions like =SUM to add values, =AVERAGE to find the mean, and =IF to perform logical tests on cell values dynamically.",
      },
    ],
    examples: [
      {
        problem: "Write a spreadsheet formula to calculate the average of cells B2 to B10.",
        solution: "=AVERAGE(B2:B10)",
      },
    ],
  },
  // ── DIVINITY (S5) ──
  {
    topicId: "div5-1",
    sections: [
      {
        heading: "The Meaning of Prophecy",
        content:
          "Prophecy in ancient Israel was a divine calling where chosen individuals acted as God's spokespersons. They addressed current political, social, and religious crises rather than just predicting the future.",
      },
      {
        heading: "The Message of Amos",
        content:
          "Amos was a prophet of social justice. He fiercely condemned the oppression of the poor, corruption in judicial systems, and hypocritical worship practices in the northern kingdom of Israel.",
      },
    ],
  },
  // ── KISWAHILI (S1) ──
  {
    topicId: "sw1-1",
    sections: [
      {
        heading: "Ngeli za Kiswahili",
        content:
          "Kiswahili noun classes (Ngeli) are grammatical groupings that determine how nouns interact with verbs and adjectives. Examples include A-WA for living human entities, and KI-VI for physical objects.",
      },
      {
        heading: "Kusujudu na Salamu",
        content:
          "Greetings are highly significant in East African culture. Standard forms include 'Hujambo' (response: 'Sijambo') and 'Habari gani' (response: 'Nzuri').",
      },
    ],
  },
  // ── LUGANDA (S1) ──
  {
    topicId: "lug1-1",
    sections: [
      {
        heading: "Ennandiki y'Oluganda",
        content:
          "Luganda is a tonal Bantu language with standardised spelling guidelines established in 1947. Correct spelling relies on exact doubling of vowels or consonant blending.",
      },
      {
        heading: "Olulyo n'Emisoso gy'Ebitundu",
        content:
          "Luganda nouns are grouped into classes (Emisoso gy'ebitundu) prefixed by letters representing singular and plural states (e.g., Omu-Aba, Oki-Ebi).",
      },
    ],
  },
  // ── LITERATURE (S1) ──
  {
    topicId: "lit1-1",
    sections: [
      {
        heading: "The Three Genres of Literature",
        content:
          "Literature is divided into three key genres: Prose (written narrative sentences), Drama (written as a script for stage performance), and Poetry (written in lines and stanzas utilizing rich devices).",
      },
      {
        heading: "Literary Devices",
        content:
          "Authors use devices to deepen meaning: Similes compare things using 'like' or 'as' (e.g., as brave as a lion), while Metaphors make direct comparisons (e.g., the classroom was a zoo).",
      },
    ],
  },
  // ── AGRICULTURE (S1) ──
  {
    topicId: "ag1-1",
    sections: [
      {
        heading: "Soil Formation and Components",
        content:
          "Soil is formed from the weathering of rocks by physical, chemical, and biological agents. Soil consists of four major components: mineral matter (45%), organic matter (5%), water (25%), and air (25%).",
      },
      {
        heading: "The Soil Profile",
        content:
          "A soil profile is a vertical cross-section showing distinct layers called horizons: Horizon A (Topsoil - fertile), Horizon B (Subsoil), and Horizon C (Parent material / Bedrock).",
      },
    ],
  },
  // ── FINE ART (S1) ──
  {
    topicId: "art1-1",
    sections: [
      {
        heading: "Still Life Drawing",
        content:
          "Still life is the drawing or painting of inanimate, physical objects (such as fruits, cups, and books) arranged deliberately to study composition, light, and form.",
      },
      {
        heading: "Understanding Shading & Perspective",
        content:
          "Shading conveys depth. Methods include hatching, cross-hatching, and blending. Perspective uses vanishing points to create the illusion of three-dimensional depth on a flat piece of paper.",
      },
    ],
  },
  // ── CRE (S1) ──
  {
    topicId: "cre1-1",
    sections: [
      {
        heading: "The Biblical Accounts of Creation",
        content:
          "Genesis contains two accounts: Genesis 1 outlines the orderly creation of the universe over six days, while Genesis 2 focuses on the intimate creation of Man (Adam) and Woman (Eve) in the Garden of Eden.",
      },
      {
        heading: "The Fall of Man",
        content:
          "The Fall describes the disobedience of Adam and Eve in eating the forbidden fruit, leading to the entrance of sin, broken relationships, physical suffering, and separation from God.",
      },
    ],
  },
];
