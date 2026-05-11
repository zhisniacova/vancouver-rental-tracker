"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type CurrentUser = {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
};

type CurrentUserContextType = {
  currentUser: CurrentUser | null;
  isLoadingCurrentUser: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(
  undefined
);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setCurrentUser(null);
          setIsLoadingCurrentUser(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, full_name, phone_number, contact_email")
        .eq("id", user.id)
        .maybeSingle();
      const metadata = user.user_metadata as {
        nickname?: string | null;
        full_name?: string | null;
      };

      if (!cancelled) {
        setCurrentUser({
          id: user.id,
          displayName:
            profile?.nickname ||
            profile?.full_name ||
            metadata?.nickname ||
            metadata?.full_name ||
            user.email ||
            "Current user",
          email: profile?.contact_email || user.email || "",
          phoneNumber: profile?.phone_number ?? null,
        });
        setIsLoadingCurrentUser(false);
      }
    }

    void loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadCurrentUser();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoadingCurrentUser) {
    return null;
  }

  return (
    <CurrentUserContext.Provider value={{ currentUser, isLoadingCurrentUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }

  return context;
}
