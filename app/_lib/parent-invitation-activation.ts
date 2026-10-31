import "server-only";

import { createAdminClient } from "../../utils/supabase/admin";

export async function getInvitationForActivation(code: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select("id, full_name, email, relationship, code, status, expires_at, children(id, full_name, rooms(name))")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error || !data || data.status !== "pending" || Date.parse(data.expires_at) <= Date.now()) return null;
  return data;
}
