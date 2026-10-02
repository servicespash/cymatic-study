import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { classLevels, subjectLabels } from "@/lib/constants";
import { topics } from "@/data/topics";
import { topicNotes } from "@/data/notes";
import { BookOpenText } from "lucide-react";

interface NoteHierarchyProps {
  onSelectNote: (note: any, topic: any) => void;
}

export const NoteHierarchy = ({ onSelectNote }: NoteHierarchyProps) => {
  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {classLevels.map((cls) => (
        <AccordionItem
          key={cls.level}
          value={`class-${cls.level}`}
          className="border rounded-xl px-4 bg-card"
        >
          <AccordionTrigger className="font-bold">{cls.label}</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {Object.entries(subjectLabels).map(([subjId, subjLabel]) => {
              const subjTopics = topics.filter(
                (t) => t.subject === subjId && t.level === cls.level,
              );
              if (subjTopics.length === 0) return null;

              return (
                <div key={subjId} className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">{subjLabel}</h4>
                  <div className="pl-4 space-y-1">
                    {subjTopics.map((topic) => {
                      const note = topicNotes.find((n) => n.topicId === topic.id);
                      return (
                        <button
                          key={topic.id}
                          onClick={() => onSelectNote(note, topic)}
                          className="flex items-center gap-2 w-full text-left text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <BookOpenText className="h-4 w-4 text-primary" />
                          {topic.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
