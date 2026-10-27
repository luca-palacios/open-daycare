"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TemporaryParentInvitation } from "../../_lib/parent-invitation";

type ParentInvitationsContextValue = {
  parentInvitations: TemporaryParentInvitation[];
  addParentInvitation: (invitation: TemporaryParentInvitation) => void;
  clearParentInvitations: () => void;
};

const ParentInvitationsContext =
  createContext<ParentInvitationsContextValue | null>(null);

export function ParentInvitationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [parentInvitations, setParentInvitations] = useState<
    TemporaryParentInvitation[]
  >([]);

  const addParentInvitation = useCallback(
    (invitation: TemporaryParentInvitation) => {
      setParentInvitations((currentInvitations) => [
        ...currentInvitations,
        invitation,
      ]);
    },
    [],
  );

  const clearParentInvitations = useCallback(() => {
    setParentInvitations([]);
  }, []);

  const value = useMemo(
    () => ({
      parentInvitations,
      addParentInvitation,
      clearParentInvitations,
    }),
    [parentInvitations, addParentInvitation, clearParentInvitations],
  );

  return (
    <ParentInvitationsContext.Provider value={value}>
      {children}
    </ParentInvitationsContext.Provider>
  );
}

export function useParentInvitations(): ParentInvitationsContextValue {
  const context = useContext(ParentInvitationsContext);

  if (!context) {
    throw new Error(
      "useParentInvitations must be used within a ParentInvitationsProvider.",
    );
  }

  return context;
}
