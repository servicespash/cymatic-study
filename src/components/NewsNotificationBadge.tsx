import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const NewsNotificationBadge: React.FC = () => {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    // Check for updates in the last 24 hours
    const checkUpdates = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from("news_broadcasts")
        .select("id")
        .eq("is_curriculum_update", true)
        .gte("published_at", yesterday.toISOString())
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasNew(true);
      }
    };

    checkUpdates();
  }, []);

  if (!hasNew) return null;

  return (
    <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-cyan-500 animate-pulse border-2 border-background" />
  );
};
