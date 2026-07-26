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
        "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-zinc-100 font-semibold">Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              createNewSession();
              onClose();
            }}
          >
            <Plus className="w-5 h-5 text-cyan-400" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "p-4 border-b border-zinc-800 cursor-pointer flex items-center justify-between hover:bg-zinc-900",
                sessionId === session.id ? "bg-zinc-900" : "",
              )}
            >
              <div
                className="flex items-center gap-3"
                onClick={() => {
                  loadSession(session.id!);
                  onClose();
                }}
              >
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-300 truncate">Chat {session.id}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => exportChatToPDF(session.messages)}
                >
                  <Download className="w-4 h-4 text-zinc-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteSession(session.id!)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <DeploymentStatus />
        </div>
      </div>
    </div>
  );
}
