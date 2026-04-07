"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type CurrentUser = "Sasha" | "Gleb";

type CurrentUserContextType = {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
};

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(
  undefined
);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser>("Sasha");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser === "Sasha" || savedUser === "Gleb") {
      setCurrentUserState(savedUser);
    }
    setMounted(true);
  }, []);

  function setCurrentUser(user: CurrentUser) {
    setCurrentUserState(user);
    localStorage.setItem("currentUser", user);
  }

  if (!mounted) {
    return null;
  }

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser }}>
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