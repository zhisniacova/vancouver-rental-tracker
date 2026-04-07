"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useNeighborhoodOptions() {
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  async function loadNeighborhoods() {
    const { data, error } = await supabase
      .from("neighborhoods")
      .select("name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading neighborhoods:", error);
      return;
    }

    setNeighborhoods(data.map((row) => row.name));
  }

  async function addNeighborhood(name: string) {
    const cleaned = name.trim();
    if (!cleaned) return;

    const { error } = await supabase
      .from("neighborhoods")
      .upsert([{ name: cleaned }], { onConflict: "name" });

    if (error) {
      console.error("Error saving neighborhood:", error);
      throw error;
    }

    await loadNeighborhoods();
  }

  useEffect(() => {
    loadNeighborhoods();
  }, []);

  return {
    neighborhoods,
    addNeighborhood,
    reloadNeighborhoods: loadNeighborhoods,
  };
}