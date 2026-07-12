import { useState } from "react";
import { Smile, Phone, ChevronUp, X } from "lucide-react";

export function TutorControlDrawer({
  onToggleCall,
  onSetMood,
}: {
  onToggleCall: () => void;
  onSetMood: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {isOpen && (
        <div className="mb-2 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-4">
          <button
            onClick={onToggleCall}
            className="p-3 hover:bg-zinc-800 rounded-xl flex items-center gap-3"
          >
            <Phone className="h-5 w-5 text-blue-400" />
            <span className="text-sm">Live Call</span>
          </button>
          <button
            onClick={onSetMood}
            className="p-3 hover:bg-zinc-800 rounded-xl flex items-center gap-3"
          >
            <Smile className="h-5 w-5 text-emerald-400" />
            <span className="text-sm">Set Mood</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="h-6 w-6" /> : <ChevronUp className="h-6 w-6" />}
      </button>
    </div>
  );
}
