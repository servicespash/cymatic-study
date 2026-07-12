import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, EyeOff, HelpCircle, AlertCircle } from "lucide-react";
import { QuizEngine, type DynamicDailyTask } from "@/lib/quiz-engine";
import { toast } from "sonner";

interface TaskContextMenuProps {
  task: DynamicDailyTask;
  children: React.ReactNode;
  onUpdate: () => void;
  onRequestExplanation: (task: DynamicDailyTask) => void;
}

export function TaskContextMenu({
  task,
  children,
  onUpdate,
  onRequestExplanation,
}: TaskContextMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  // Close menu on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuVisible(false);
      }
    };
    if (menuVisible) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuVisible]);

  // Handle Right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setMenuVisible(true);
  };

  // Mobile Long Press Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    touchTimer.current = setTimeout(() => {
      setPosition({ x: clientX, y: clientY });
      setMenuVisible(true);
      if (navigator.vibrate) {
        navigator.vibrate(50); // Soft haptic feedback
      }
    }, 600); // 600ms long press threshold
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  const togglePriority = () => {
    QuizEngine.setPriority(task.id, !task.priority);
    toast.success(task.priority ? "Priority label removed" : "Marked as high priority!", {
      icon: <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />,
    });
    setMenuVisible(false);
    onUpdate();
  };

  const snoozeTask = () => {
    QuizEngine.snoozeTask(task.id);
    toast.info(`"${task.title}" has been snoozed.`, {
      description: "You can unsnooze it anytime from the bottom options panel.",
    });
    setMenuVisible(false);
    onUpdate();
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      {children}

      <AnimatePresence>
        {menuVisible && (
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: `${Math.min(position.x, window.innerWidth - 220)}px`,
              top: `${Math.min(position.y, window.innerHeight - 180)}px`,
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="w-52 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-glow shadow-black/60 backdrop-blur-md"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900 mb-1">
                Task Command Menu
              </div>

              <button
                onClick={togglePriority}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all"
              >
                <Star
                  className={`h-3.5 w-3.5 ${task.priority ? "text-yellow-400 fill-yellow-400" : "text-zinc-500"}`}
                />
                {task.priority ? "Remove Priority" : "Mark as Priority"}
              </button>

              <button
                onClick={snoozeTask}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-all"
              >
                <EyeOff className="h-3.5 w-3.5 text-zinc-500" />
                Snooze Challenge
              </button>

              <button
                onClick={() => {
                  onRequestExplanation(task);
                  setMenuVisible(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-300 transition-all"
              >
                <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                Ask AI Tutor Why
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
