import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export const HOME_BY_ROLE: Record<UserRole, string> = {
  client: "/cliente",
  psychologist: "/psicologo",
  admin: "/admin",
};

/** Usuário logado + perfil (uma consulta por requisição). */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;
  return { user, profile, supabase };
});

/** Garante o papel; senão manda para o login ou para a área certa. */
export async function requireRole(role: UserRole) {
  const current = await getCurrentUser();
  if (!current) redirect("/entrar");
  if (current.profile.role !== role) redirect(HOME_BY_ROLE[current.profile.role]);
  return current;
}
