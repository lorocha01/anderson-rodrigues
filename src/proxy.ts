import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isSupabaseConfigured } from "@/lib/env";

// Sem Supabase configurado, as áreas logadas e o login levam para a demonstração.
const DEMO_REDIRECTS: [string, string][] = [
  ["/cliente", "/demo/cliente"],
  ["/psicologo", "/demo/psicologo"],
  ["/admin", "/demo/admin"],
  ["/entrar", "/demo"],
  ["/cadastro", "/demo/cliente"],
  ["/esqueci-senha", "/demo"],
  ["/redefinir-senha", "/demo"],
];

export async function proxy(request: NextRequest) {
  if (isSupabaseConfigured()) return updateSession(request);

  const path = request.nextUrl.pathname;
  const match = DEMO_REDIRECTS.find(([from]) => path === from || path.startsWith(`${from}/`));
  if (!match) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = match[1];
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
