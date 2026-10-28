import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/educator-request")({
  component: EducatorRequestForm,
});

function EducatorRequestForm() {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    // Note: Assuming 'pending_educators' exists in Supabase
    const { error } = await supabase.from("pending_educators").insert({
      user_id: user.id,
      reason,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Request submitted successfully");
      setReason("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Request Educator Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Explain why you need educator access..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
