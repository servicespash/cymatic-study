import { Plus, Trash2, Download, MessageSquare } from "lucide-react";
import { useTutorStore } from "@/store/useTutorStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportChatToPDF } from "@/lib/chat-pdf-export";
import { DeploymentStatus } from "./DeploymentStatus";

export function ChatSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sessions, sessionId, loadSession, createNewSession, deleteSession, messages } =
    useTutorStore();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 lg:w-96 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ease-in-out shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-zinc-100 font-bold tracking-tight">Chats & History</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-zinc-900"
            onClick={() => {
              createNewSession();
              onClose();
            }}
          >
            <Plus className="w-5 h-5 text-cyan-400" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "p-3.5 my-1 rounded-xl border border-transparent cursor-pointer flex items-center justify-between hover:bg-zinc-900 transition-colors",
                sessionId === session.id ? "bg-zinc-900 border-zinc-800 shadow-sm" : "",
              )}
            >
              <div
                className="flex items-center gap-3 min-w-0 flex-1"
                onClick={() => {
                  loadSession(session.id!);
                  onClose();
                }}
              >
                <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-sm font-medium text-zinc-200 truncate">
                  Chat {session.id}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                  onClick={() => exportChatToPDF(session.messages)}
                  title="Export to PDF"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-400"
                  onClick={() => deleteSession(session.id!)}
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="p-5 border-t border-zinc-800 bg-zinc-950">
          <DeploymentStatus />
        </div>
      </div>
    </div>
  );
}
