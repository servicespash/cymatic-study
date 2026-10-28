import React, { useState } from "react";
import { useDexieStatus } from "@/hooks/useDexieStatus";
import { Database, CheckCircle2, RefreshCw, WifiOff, HardDrive, ArrowUpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function DexieSyncIndicator() {
  const {
    isOnline,
    isDatabaseReady,
    isSyncing,
    pendingSyncCount,
    cachedRecordsCount,
    lastSyncTime,
    triggerManualSync,
  } = useDexieStatus();

  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Dexie offline database status"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors shrink-0"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="hidden sm:inline font-mono text-[11px] text-cyan-400">
                Syncing...
              </span>
            </>
          ) : !isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-mono text-[11px] text-amber-400 font-semibold">
                Offline Ready
              </span>
            </>
          ) : pendingSyncCount > 0 ? (
            <>
              <ArrowUpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-mono text-[11px] text-cyan-400">
                {pendingSyncCount} pending
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/90" />
              <span className="hidden md:inline font-mono text-[11px] text-muted-foreground">
                Synced
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-4 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl text-foreground"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-tight">Dexie Local Storage</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isDatabaseReady
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isDatabaseReady ? "Healthy" : "Offline DB Init"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Network State</span>
              <span className={`font-semibold ${isOnline ? "text-emerald-400" : "text-amber-400"}`}>
                {isOnline ? "Online (Connected)" : "Offline (Local Dexie)"}
              </span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Cached Local Records</span>
              <span className="font-mono text-foreground font-semibold">
                {cachedRecordsCount} items
              </span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Pending Sync Queue</span>
              <span
                className={`font-mono font-semibold ${
                  pendingSyncCount > 0 ? "text-amber-400" : "text-foreground"
                }`}
              >
                {pendingSyncCount} changes
              </span>
            </div>

            {lastSyncTime && (
              <div className="flex items-center justify-between text-muted-foreground pt-1">
                <span>Last Synchronized</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!isOnline || isSyncing}
              onClick={() => void triggerManualSync()}
              className="w-full text-xs font-semibold gap-1.5 h-8 rounded-lg border-border/70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Synchronizing..." : "Sync Database Now"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
