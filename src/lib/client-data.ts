import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipBalance } from "@/lib/types";

/** Ciclos/pacotes vigentes do cliente logado, do que vence primeiro ao último. */
export async function currentMemberships(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("membership_balances")
    .select("*")
    .eq("is_current", true)
    .order("ends_at")
    .returns<MembershipBalance[]>();
  return data ?? [];
}

/** Total de atendimentos disponíveis (null = livre). */
export function availableSessions(memberships: MembershipBalance[]) {
  if (memberships.some((m) => m.sessions_remaining === null)) return null;
  return memberships.reduce((sum, m) => sum + (m.sessions_remaining ?? 0), 0);
}
