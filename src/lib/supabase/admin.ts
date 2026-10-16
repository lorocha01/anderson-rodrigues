import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service_role: ignora RLS. Use só em código de servidor e
 * sempre depois de verificar o papel do usuário (requireRole).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
