import { MessageSquare, Plus, Settings, Menu, X, History, Phone, Smile } from "lucide-react";

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
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 text-zinc-300 hover:text-white p-2 hover:bg-zinc-800 rounded-lg"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Main Controls */}
          <button
            onClick={onToggleCall}
            className="w-full flex items-center gap-2 text-sm text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg"
          >
            <Phone className="h-4 w-4 text-blue-400" />
            <span>Live Call</span>
          </button>
          <button
            onClick={onSetMood}
            className="w-full flex items-center gap-2 text-sm text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg"
          >
            <Smile className="h-4 w-4 text-emerald-400" />
            <span>Set Mood</span>
          </button>

          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 pt-4">
            Recent
          </h2>
          <button className="w-full flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 p-2 hover:bg-zinc-800 rounded-lg">
            <History className="h-4 w-4" />
            <span className="truncate">Math Quadratics</span>
          </button>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 w-full p-2 hover:bg-zinc-800 rounded-lg"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
