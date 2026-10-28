import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { classLevels, subjectLabels } from "@/lib/constants";
import { getCombinedTopics, getCombinedTopicNote } from "@/lib/curriculum-store";
import { BookOpenText } from "lucide-react";
import { AepCurriculumIndex } from "@/components/curriculum/AepCurriculumIndex";

interface NoteHierarchyProps {
  onSelectNote: (note: any, topic: any) => void;
}

export const NoteHierarchy = ({ onSelectNote }: NoteHierarchyProps) => {
  return (
    <div className="space-y-4">
      <AepCurriculumIndex />
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
                const subjTopics = getCombinedTopics(subjId, cls.level);
                if (subjTopics.length === 0) return null;

                return (
                  <div key={subjId} className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">{subjLabel}</h4>
                    <div className="pl-4 space-y-1">
                      {subjTopics.map((topic) => {
                        const note = getCombinedTopicNote(topic.id);
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
    </div>
  );
};
