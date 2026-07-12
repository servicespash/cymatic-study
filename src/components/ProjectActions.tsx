import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send,
  MessageSquare,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { newToken, buildWhatsAppUrl, buildMarkingLink } from "@/lib/project-link";

interface ProjectActionsProps {
  state: any;
  user: any;
  profile: any;
  status: string;
  onSync: (data: any) => void;
  isSyncing: boolean;
}

export function ProjectActions({
  state,
  user,
  profile,
  status,
  onSync,
  isSyncing,
}: ProjectActionsProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sync");
  const [copied, setCopied] = useState(false);

  const markingToken = useMemo(() => state.markingToken || newToken(), [state.markingToken]);
  const fullMarkingLink = useMemo(() => buildMarkingLink(markingToken), [markingToken]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullMarkingLink);
    setCopied(true);
    toast.success("Marking link copied!");
    // Trigger submission status change to pending when copied
    // (This functionality might need re-wiring depending on how onSync works, but retaining as per original design)
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = `Please review my NCDC project: ${state.title}. Here is the secure marking link: ${fullMarkingLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`NCDC Project Assessment Request: ${state.title}`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease review my NCDC project titled "${state.title}".\n\nYou can access the secure marking desk here:\n${fullMarkingLink}\n\nThank you.`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const canSync = !!profile?.school_id || !!profile?.org_id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={status !== "draft"}
          variant={status === "draft" ? "default" : "secondary"}
          className="flex-1 h-14 font-bold text-lg shadow-glow"
        >
          {status === "draft" ? (
            <ShieldCheck className="mr-2 h-5 w-5" />
          ) : (
            <CheckCircle2 className="mr-2 h-5 w-5" />
          )}
          {status === "draft" ? "Send for Marking" : "Locked for Review"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Project Submission Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sync" className="text-xs">
              Institutional Sync
            </TabsTrigger>
            <TabsTrigger value="share" className="text-xs">
              Share Marking Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-4 pt-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-2" />
              <h4 className="font-bold">Institutional Sync</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Directly submit to your school's database for official grading.
              </p>
            </div>

            {canSync ? (
              <Button
                onClick={() => {
                  onSync(state);
                  setOpen(false);
                }}
                disabled={isSyncing}
                className="w-full h-12 font-bold"
              >
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
            ) : (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  You are currently an Independent User. Link a School ID in your profile to use
                  In-App Sync.
                </span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="share" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Secure Marking Link
              </Label>
              <div className="flex gap-2">
                <Input value={fullMarkingLink} readOnly className="font-mono text-xs" />
                <Button onClick={handleCopy} className="shrink-0 gap-2">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 pt-2">
              <Button
                onClick={handleWhatsApp}
                className="gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
              >
                <MessageSquare className="h-4 w-4" />
                Share via WhatsApp
              </Button>
              <Button onClick={handleEmail} variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email Link to Teacher
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
