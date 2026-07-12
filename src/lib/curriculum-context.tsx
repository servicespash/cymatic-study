import { createContext, useContext, useState, ReactNode } from "react";

type CurriculumLevel = "lower-secondary" | "a-level";

interface CurriculumContextType {
  mode: CurriculumLevel;
  setMode: (mode: CurriculumLevel) => void;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CurriculumLevel>("lower-secondary");
  return (
    <CurriculumContext.Provider value={{ mode, setMode }}>{children}</CurriculumContext.Provider>
  );
}

export function useCurriculum() {
  const context = useContext(CurriculumContext);
  if (!context) throw new Error("useCurriculum must be used within CurriculumProvider");
  return context;
}
