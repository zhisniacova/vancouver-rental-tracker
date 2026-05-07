"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  normalizeRentalPreferences,
  type RentalCriteriaPreferences,
} from "@/lib/rentalPreferences";

export type RentalSearchWorkspace = {
  id: string;
  name: string;
  criteriaPreferences: RentalCriteriaPreferences;
};

type WorkspaceContextType = {
  workspaces: RentalSearchWorkspace[];
  currentRentalSearchId: string | null;
  currentWorkspace: RentalSearchWorkspace | null;
  isLoadingWorkspaces: boolean;
  setCurrentRentalSearchId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

const CURRENT_WORKSPACE_STORAGE_KEY = "currentRentalSearchId";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<RentalSearchWorkspace[]>([]);
  const [currentRentalSearchId, setCurrentRentalSearchIdState] = useState<
    string | null
  >(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  async function refreshWorkspaces() {
    const { data, error } = await supabase
      .from("rental_searches")
      .select("id, name, criteria_preferences")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading rental searches:", error);
      setWorkspaces([]);
      setCurrentRentalSearchIdState(null);
      setIsLoadingWorkspaces(false);
      return;
    }

    const nextWorkspaces = (data ?? []).map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      criteriaPreferences: normalizeRentalPreferences(
        workspace.criteria_preferences
      ),
    }));
    const savedId =
      typeof window !== "undefined"
        ? localStorage.getItem(CURRENT_WORKSPACE_STORAGE_KEY)
        : null;
    const savedWorkspace = nextWorkspaces.find(
      (workspace) => workspace.id === savedId
    );
    const nextCurrentId = savedWorkspace?.id ?? nextWorkspaces[0]?.id ?? null;

    setWorkspaces(nextWorkspaces);
    setCurrentRentalSearchIdState(nextCurrentId);

    if (nextCurrentId) {
      localStorage.setItem(CURRENT_WORKSPACE_STORAGE_KEY, nextCurrentId);
    } else {
      localStorage.removeItem(CURRENT_WORKSPACE_STORAGE_KEY);
    }

    setIsLoadingWorkspaces(false);
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void refreshWorkspaces();
    }, 0);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshWorkspaces();
    });

    return () => {
      window.clearTimeout(loadTimer);
      subscription.unsubscribe();
    };
  }, []);

  const currentWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === currentRentalSearchId) ??
      null,
    [currentRentalSearchId, workspaces]
  );

  function setCurrentRentalSearchId(id: string) {
    setCurrentRentalSearchIdState(id);
    localStorage.setItem(CURRENT_WORKSPACE_STORAGE_KEY, id);
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentRentalSearchId,
        currentWorkspace,
        isLoadingWorkspaces,
        setCurrentRentalSearchId,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }

  return context;
}
