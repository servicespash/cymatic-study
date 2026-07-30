import { MessageSquare, Plus, Settings, Menu, X, History, Phone, Smile } from "lucide-react";
import { DeploymentStatus } from "./DeploymentStatus";

export function Sidebar({
  isOpen,
  setIsOpen,
  onNewChat,
  onSettingsClick,
  onToggleCall,
  onSetMood,
}: {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  onNewChat: () => void;
  onSettingsClick: () => void;
  onToggleCall: () => void;
  onSetMood: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-80 lg:w-96 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col shadow-2xl`}
      >
        <div className="p-5 flex items-center justify-between border-b border-zinc-800/80">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2.5 text-zinc-200 hover:text-white px-3 py-2 hover:bg-zinc-800 rounded-xl transition-colors font-medium text-sm"
          >
            <Plus className="h-5 w-5 text-cyan-400" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-zinc-400 hover:text-white p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Main Controls */}
          <button
            onClick={onToggleCall}
            className="w-full flex items-center gap-3 text-sm text-zinc-300 hover:text-white p-3 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <Phone className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="font-medium">Live Voice Call</span>
          </button>
          <button
            onClick={onSetMood}
            className="w-full flex items-center gap-3 text-sm text-zinc-300 hover:text-white p-3 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <Smile className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">Set Mood / Vibe</span>
          </button>

          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 pt-6 pb-2">
            Recent Sessions
          </h2>
          <button className="w-full flex items-center gap-3 text-sm text-zinc-400 hover:text-zinc-200 p-3 hover:bg-zinc-800 rounded-xl transition-colors">
            <History className="h-4 w-4 shrink-0" />
            <span className="truncate">Math Quadratics & Physics</span>
          </button>
        </div>

        <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-900/50">
          <DeploymentStatus />
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-3 text-sm text-zinc-400 hover:text-zinc-200 w-full p-3 hover:bg-zinc-800 rounded-xl transition-colors font-medium"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
