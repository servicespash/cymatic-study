/**
 * Robust Link Parser Utility
 * Isolates URLs, Emails, and Phone numbers from conjoined words or punctuation
 * using negative lookahead/lookbehind patterns.
 */

const CONJOINED_WORDS = [
  "or",
  "and",
  "is",
  "to",
  "in",
  "at",
  "by",
  "for",
  "from",
  "with",
  "on",
  "about",
  "through",
  "into",
  "during",
  "including",
  "until",
  "against",
  "among",
  "throughout",
  "despite",
  "towards",
  "upon",
  "concerning",
  "but",
  "yet",
  "so",
];

const COMMON_TLDS = [
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "io",
  "xyz",
  "ai",
  "me",
  "uk",
  "ug",
  "info",
  "biz",
];

/**
 * Pre-processes text to separate conjoined links and words.
 * Example: "gmail.comor" -> "gmail.com or"
 */
export const sanitizeConjoinedLinks = (text: string): string => {
  if (!text) return "";

  let result = text;

  // 1. Fix common TLD + Word conjoining (e.g. .comor -> .com or)
  // Using a negative lookahead to ensure we only split when followed by a word boundary or end of string
  const tldPattern = COMMON_TLDS.join("|");
  const wordPattern = CONJOINED_WORDS.join("|");

  // Regex explanation:
  // \.(${tldPattern}) : matches a dot followed by a common TLD
  // (${wordPattern})  : matches a common conjoined word
  // (?![a-zA-Z0-9])   : negative lookahead ensures the word is not just the start of a longer word (e.g. .comorbit)
  const conjoinedRegex = new RegExp(`\\.(${tldPattern})(${wordPattern})(?![a-zA-Z0-9])`, "gi");

  result = result.replace(conjoinedRegex, ".$1 $2");

  // 2. Separate links from noise characters like hyphens or commas used as connectors
  // Example: "resonance.cymatichub.xyz,a space" -> "resonance.cymatichub.xyz a space"
  // Example: "study.cymatichub.xyz-to" -> "study.cymatichub.xyz to"
  result = result.replace(/([a-zA-Z0-9.-]+\.[a-z]{2,})([-—,;])([a-z]+)/gi, "$1 $3");

  return result;
};

/**
 * Enhanced regex patterns for capturing links without trailing noise.
 * Using non-capturing groups (?:...) to prevent doubling during string splitting.
 */
export const LINK_PATTERNS = {
  // Negative lookahead to exclude trailing punctuation from the link itself
  url: /https?:\/\/[^\s,;<>!]+(?![a-zA-Z0-9])/gi,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?![a-zA-Z0-9])/gi,
  phone: /\+?[0-9][0-9\s.-]{8,}[0-9](?![0-9])/gi,
};
