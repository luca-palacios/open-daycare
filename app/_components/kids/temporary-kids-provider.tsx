"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Kid } from "../../_data/kids";

type TemporaryKidsContextValue = {
  temporaryKids: Kid[];
  addTemporaryKid: (kid: Kid) => void;
  clearTemporaryKids: () => void;
};

const TemporaryKidsContext =
  createContext<TemporaryKidsContextValue | null>(null);

export function TemporaryKidsProvider({ children }: { children: ReactNode }) {
  const [temporaryKids, setTemporaryKids] = useState<Kid[]>([]);

  const addTemporaryKid = useCallback((kid: Kid) => {
    setTemporaryKids((currentKids) => [...currentKids, kid]);
  }, []);

  const clearTemporaryKids = useCallback(() => {
    setTemporaryKids([]);
  }, []);

  const value = useMemo(
    () => ({ temporaryKids, addTemporaryKid, clearTemporaryKids }),
    [temporaryKids, addTemporaryKid, clearTemporaryKids],
  );

  return (
    <TemporaryKidsContext.Provider value={value}>
      {children}
    </TemporaryKidsContext.Provider>
  );
}

export function useTemporaryKids(): TemporaryKidsContextValue {
  const context = useContext(TemporaryKidsContext);

  if (!context) {
    throw new Error(
      "useTemporaryKids must be used within a TemporaryKidsProvider.",
    );
  }

  return context;
}
