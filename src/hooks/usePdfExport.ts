import { useCallback } from "react";
import { exportToBrandedPdf } from "@/lib/branded-pdf-export";
import { useAuth } from "./useAuth";

interface PdfContent {
  sectionTitle: string;
  body:
    | string
    | string[]
    | { key: string; value: string }[]
    | { q: string; options?: string[]; a: string }[];
}

export function usePdfExport() {
  const { isTeacher, isAdmin } = useAuth();

  const exportPdf = useCallback(
    async (options: {
      title: string;
      subject: string;
      docType: "lesson_notes" | "quiz_results" | "progress_report" | "study_chart" | "quiz";
      content: PdfContent[];
      includeAnswers?: boolean;
      userName?: string;
      schoolName?: string;
      isBlackAndWhite?: boolean;
      paperSize?: "a4" | "letter";
      language?: "en" | "lg" | "sw";
    }) => {
      console.log(`[PDF Export] Generating ${options.docType} for ${options.title}`);

      // Strict policy: Only teachers/admins can include answers/sensitive data
      const canShowSensitive = isTeacher || isAdmin;
      const finalIncludeAnswers = options.includeAnswers && canShowSensitive;

      // Filter content based on context and permissions
      const filteredContent = options.content.map((item) => {
        if (
          (options.docType === "quiz_results" || options.docType === "quiz") &&
          !finalIncludeAnswers
        ) {
          // Programmatically strip sensitive assessment data if policy forbids it
          if (typeof item.body === "string") {
            return {
              ...item,
              body: item.body.replace(/Correct Answer:.*$/gm, "[Answer Hidden]"),
            };
          } else if (Array.isArray(item.body)) {
            // Handle array of questions or key-value pairs
            return {
              ...item,
              body: item.body.map((qObj: any) => {
                if (qObj && typeof qObj === "object" && "a" in qObj) {
                  return { ...qObj, a: "[Answer Hidden]" };
                }
                return qObj;
              }),
            };
          }
        }
        return item;
      });

      try {
        await exportToBrandedPdf({
          title: options.title,
          subject: options.subject,
          docType: options.docType as any,
          content: filteredContent as any,
          userName: options.userName,
          schoolName: options.schoolName,
          isBlackAndWhite: options.isBlackAndWhite,
          paperSize: options.paperSize,
          language: options.language,
          showAnswers: finalIncludeAnswers,
        });
      } catch (err) {
        console.error("[PDF Export] Failed to generate PDF:", err);
        throw err;
      }
    },
    [isTeacher, isAdmin],
  );

  return { exportPdf };
}
