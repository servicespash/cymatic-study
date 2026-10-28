import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Atom,
  ChevronDown,
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Lock,
  X,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SCIENCE_SUBJECTS,
  CLASS_LEVELS_SCIENCE,
  MASKED_ARTS_AND_HUMANITIES,
  type ScienceSubjectDef,
} from "@/data/scienceCurriculum";

export function ScienceCurriculumNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const navigate = useNavigate();

  const handleSelectSubject = (subjId: string) => {
    setIsOpen(false);
    navigate({
      to: "/lessons",
      search: {
        subject: subjId,
        level: selectedLevel,
      } as any,
    });
  };

  return (
    <div className="relative">
      {/* Sleek Navigation Trigger Button - Zero Bloat */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 gap-1.5 text-xs font-bold rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all shadow-sm"
        aria-expanded={isOpen}
      >
        <Atom className="h-4 w-4 text-primary animate-pulse" />
        <span className="hidden sm:inline">Science Hub</span>
        <Badge className="h-4 px-1 text-[9px] bg-primary/20 text-primary font-mono border-none">
          S1–S6
        </Badge>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {/* Professional Outreach & Preview Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[92vw] max-w-xl z-50 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                  <Atom className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                    Uganda Science Curriculum
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Senior 1–6 Primary Academic Tree
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close Preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Class Level Selector */}
            <div className="my-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Target Class Level:
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {CLASS_LEVELS_SCIENCE.map((cls) => (
                  <button
                    key={cls.level}
                    onClick={() => setSelectedLevel(cls.level)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                      selectedLevel === cls.level
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cls.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Science Subjects Outreach Grid */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sciences Room (S.{selectedLevel}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SCIENCE_SUBJECTS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSubject(s.id)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/60 hover:border-primary/40 transition-all text-left group"
                    >
                      <div className="p-2 rounded-lg bg-card border border-border/80 group-hover:scale-105 transition-transform shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                            {s.title}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {s.unebCode.split("/")[0]}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {s.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arts & Humanities Masked Room State */}
            <div className="p-2.5 rounded-xl border border-dashed border-border/80 bg-muted/10 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-semibold text-muted-foreground text-xs">
                    Arts &amp; Humanities Room
                  </span>
                  <p className="text-[10px] text-muted-foreground/80">
                    History, Geography, Entrepreneurship &amp; Languages
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] bg-muted/40 text-muted-foreground border-border shrink-0"
              >
                <Lock className="h-2.5 w-2.5 mr-1 inline" />
                Coming Soon
              </Badge>
            </div>

            {/* Footer Navigation */}
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Senior {selectedLevel} Curriculum Active
              </span>
              <Button
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  navigate({ to: "/lessons" });
                }}
                className="h-8 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Explore All Lessons
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
