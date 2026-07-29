import React, { useState } from "react";
import { MessageSquarePlus, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "@tanstack/react-router";

export default function QuickFeedbackButton() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>("suggestion");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to send feedback");
      return;
    }

    if (!message.trim()) {
      toast.error("Please provide a message");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        type: feedbackType,
        section: location.pathname,
        message: message.trim(),
        status: "open",
      });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setMessage("");
      setIsOpen(false);
    } catch (error: any) {
      console.error("Feedback error:", error);
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Give Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Quick Feedback</DialogTitle>
            <DialogDescription>
              Spotted a bug or have a suggestion for this section? Let us know!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Feedback Type</Label>
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="bug">Report an Issue</SelectItem>
                  <SelectItem value="general">General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="section">Study Section</Label>
              <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {location.pathname}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="How can we make this better?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Sending..." : "Send Feedback"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
