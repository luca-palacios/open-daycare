"use client";

import { useCallback, useEffect, useState } from "react";
import { getKidAvatarTone, type KidAvatarTone } from "../../_lib/avatar-tones";
import { getKidInitials } from "../../_lib/kid-profile";
import { createClient } from "../../../utils/supabase/client";

export type SolesKid = {
  id: string;
  name: string;
  initials: string;
  avatarTone: KidAvatarTone;
};

type LoadStatus = "loading" | "ready" | "error";

export function useSolesKids() {
  const [kids, setKids] = useState<SolesKid[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadSolesKids() {
      try {
        const { data, error } = await createClient()
          .from("children")
          .select("id, full_name, rooms!inner(name)")
          .eq("status", "active")
          .eq("rooms.name", "Soles")
          .order("full_name");

        if (ignore) return;

        if (error) {
          setStatus("error");
          return;
        }

        setKids(
          data.map((child) => ({
            id: child.id,
            name: child.full_name,
            initials: getKidInitials(child.full_name),
            avatarTone: getKidAvatarTone(child.id),
          })),
        );
        setStatus("ready");
      } catch {
        if (!ignore) setStatus("error");
      }
    }

    loadSolesKids();

    return () => {
      ignore = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setStatus("loading");
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  return { kids, status, reload };
}
