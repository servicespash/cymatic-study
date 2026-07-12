import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Broadcast = {
  id: string;
  title: string;
  body: string;
  media_url: string;
  is_active: boolean;
  theme_mood?: "urgent" | "casual" | "educational";
};

type LiveBroadcastContextType = {
  activeBroadcast: Broadcast | null;
  selectedBroadcast: Broadcast | null;
  isLoading: boolean;
  /** Sets the broadcast to be played in 'Podcast Mode' */
  selectBroadcast: (broadcast: Broadcast | null) => void;
};

const LiveBroadcastContext = createContext<LiveBroadcastContextType>({
  activeBroadcast: null,
  selectedBroadcast: null,
  isLoading: true,
  selectBroadcast: () => {},
});

export const LiveBroadcastProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeBroadcast, setActiveBroadcast] = useState<Broadcast | null>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Sets the currently selected broadcast for 'Podcast Mode'.
   * @param broadcast The broadcast item to play, or null to clear.
   */
  const selectBroadcast = useCallback((broadcast: Broadcast | null) => {
    setSelectedBroadcast(broadcast);
  }, []);

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const { data, error } = await supabase
          .from("news_broadcasts")
          .select("*")
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          // Silent failure
        } else {
          setActiveBroadcast(data as Broadcast);
        }
      } catch (err) {
        // Silent failure
      } finally {
        setIsLoading(false);
      }
    };

    fetchBroadcast();

    const channel = supabase
      .channel("broadcast-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news_broadcasts" },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            (payload.eventType === "UPDATE" && payload.new.is_active === true)
          ) {
            setActiveBroadcast(payload.new as Broadcast);
          } else if (
            payload.eventType === "DELETE" ||
            (payload.eventType === "UPDATE" && payload.new.is_active === false)
          ) {
            setActiveBroadcast(null);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <LiveBroadcastContext.Provider
      value={{ activeBroadcast, selectedBroadcast, isLoading, selectBroadcast }}
    >
      {children}
    </LiveBroadcastContext.Provider>
  );
};

export const useLiveBroadcast = () => useContext(LiveBroadcastContext);
