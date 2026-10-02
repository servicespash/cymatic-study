export const sanitizeTutorResponse = (text: string): string => {
  if (!text) return "";
  // Strip out //**, //*, and other common noise patterns often seen in LLM streaming/debug outputs
  return (
    text
      .replace(/\/\/\*+/g, "")
      .replace(/\/\*+/g, "")
      .replace(/\*+\/\//g, "")
      .replace(/\/\/\s?\*+/g, "")
      .replace(/\/\*\*+/g, "")
      // Remove 'www.' from common portfolio links as requested
      .replace(/(https?:\/\/)(www\.)/gi, "$1")
      .trim()
  );
};
