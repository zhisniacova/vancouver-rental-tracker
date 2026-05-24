"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useNeighborhoodOptions(rentalSearchId?: string | null) {
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  async function loadNeighborhoods() {
    if (!rentalSearchId) {
      setNeighborhoods([]);
      return;
    }

    const { data, error } = await supabase
      .from("listings")
      .select("neighborhood")
      .eq("rental_search_id", rentalSearchId)
      .not("neighborhood", "is", null)
      .order("neighborhood", { ascending: true });

    if (error) {
      console.error("Error loading neighborhoods:", error);
      return;
    }

    setNeighborhoods(
      Array.from(
        new Set(
          data
            .map((row) => row.neighborhood?.trim())
            .filter((name): name is string => Boolean(name))
        )
      )
    );
  }

  async function addNeighborhood(name: string) {
    const cleaned = name.trim();
    if (!cleaned) return;

    setNeighborhoods((current) =>
      current.some((name) => name.toLowerCase() === cleaned.toLowerCase())
        ? current
        : [...current, cleaned].sort((a, b) => a.localeCompare(b))
    );
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialNeighborhoods() {
      const { data, error } = await supabase
        .from("listings")
        .select("neighborhood")
        .eq("rental_search_id", rentalSearchId)
        .not("neighborhood", "is", null)
        .order("neighborhood", { ascending: true });

      if (error) {
        console.error("Error loading neighborhoods:", error);
        return;
      }

      if (!isCancelled) {
        setNeighborhoods(
          Array.from(
            new Set(
              data
                .map((row) => row.neighborhood?.trim())
                .filter((name): name is string => Boolean(name))
            )
          )
        );
      }
    }

    if (rentalSearchId) {
      loadInitialNeighborhoods();
    } else {
      window.setTimeout(() => setNeighborhoods([]), 0);
    }

    return () => {
      isCancelled = true;
    };
  }, [rentalSearchId]);

  return {
    neighborhoods,
    addNeighborhood,
    reloadNeighborhoods: loadNeighborhoods,
  };
}
