export type FlashParams = Promise<{ ok?: string; erro?: string }>;

/** Monta a URL de retorno com uma mensagem de sucesso ou erro. */
export function withMsg(path: string, kind: "ok" | "erro", message: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`;
}

/** Mensagem legível a partir de um erro do Supabase/Postgres. */
export function errorText(error: { message?: string } | null | undefined, fallback = "Algo deu errado. Tente novamente.") {
  const msg = error?.message?.trim();
  if (!msg) return fallback;
  if (/permission denied|row-level security/i.test(msg)) return "Você não tem permissão para isso.";
  return msg;
}
