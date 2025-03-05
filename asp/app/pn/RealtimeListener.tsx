"use client";

import { useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

const RealtimeListener = ({ onUpdate }) => {
  useEffect(() => {
    const channel = supabase
      .channel("realtime-pn")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pn" },
        (payload) => {
          console.log("🔄 Supabase change detected:", payload);
          onUpdate(); // Fetch new data when change is detected
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Cleanup listener on unmount
    };
  }, [onUpdate]);

  return null; // No UI, just listens for real-time changes
};

export default RealtimeListener;
