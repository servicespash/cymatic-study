export const sanitizeTutorResponse = (text: string): string => {
  if (!text) return "";
  // Strip out //**, //*, and other noise patterns
  return text.replace(/\/\/\*+/g, "").trim();
};
