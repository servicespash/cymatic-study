import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, X, ZoomIn } from "lucide-react";

interface DiagramLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagram: {
    id?: string;
    title?: string;
    name?: string;
    virtualPath?: string;
    caption?: string;
    dataUrl?: string;
  } | null;
}

export function DiagramLightboxModal({ isOpen, onClose, diagram }: DiagramLightboxModalProps) {
  if (!diagram) return null;

  const title = diagram.title || diagram.name || "Curriculum Scientific Diagram";
  const path = diagram.virtualPath || "curriculum/assets/diagram.png";

  const handleDownload = () => {
    if (!diagram.dataUrl) return;
    const a = document.createElement("a");
    a.href = diagram.dataUrl;
    a.download = path.split("/").pop() || "scientific_diagram.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto bg-card/95 border-border shadow-2xl backdrop-blur-xl p-0">
        <DialogHeader className="p-4 sm:p-6 border-b border-border/80 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1 pr-6 min-w-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                {title}
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                Scientific Figure
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              Directory Path: <span className="text-primary">{path}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {diagram.dataUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="h-8 text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save Asset</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-black/40 min-h-[300px]">
          {diagram.dataUrl ? (
            <img
              src={diagram.dataUrl}
              alt={title}
              referrerPolicy="no-referrer"
              className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg border border-border/40"
            />
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Diagram asset data unavailable.
            </div>
          )}
        </div>

        {diagram.caption && (
          <div className="p-4 sm:p-6 border-t border-border/80 bg-muted/20">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Figure Analysis &amp; Caption
            </p>
            <p className="text-xs text-foreground/90 leading-relaxed font-sans">
              {diagram.caption}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
