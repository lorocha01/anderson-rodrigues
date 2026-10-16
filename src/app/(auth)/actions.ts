"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME_BY_ROLE } from "@/lib/auth";
import { withMsg } from "@/lib/flash";
import type { UserRole } from "@/lib/types";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const msg = error?.code === "email_not_confirmed"
      ? "Confirme seu e-mail pelo link que enviamos antes de entrar."
      : "E-mail ou senha incorretos.";
    redirect(withMsg(`/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`, "erro", msg));
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single<{ role: UserRole }>();
  redirect(next || HOME_BY_ROLE[profile?.role ?? "client"]);
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const plan = String(formData.get("plano") ?? "");
  const consent = formData.get("consent") === "on";
  const back = `/cadastro${plan ? `?plano=${plan}` : ""}`;

  if (!fullName || !email) redirect(withMsg(back, "erro", "Preencha nome e e-mail."));
  if (password.length < 8) redirect(withMsg(back, "erro", "A senha precisa ter pelo menos 8 caracteres."));
  if (!consent) redirect(withMsg(back, "erro", "Para continuar, aceite os termos e o tratamento dos seus dados."));

  const next = plan ? `/cliente/planos/${plan}` : "/cliente";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, consent: "true" },
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const msg = error.code === "user_already_exists" ? "Já existe uma conta com este e-mail." : error.message;
    redirect(withMsg(back, "erro", msg));
  }

  // Sem sessão = confirmação de e-mail ativada no Supabase.
  if (!data.session) {
    redirect(withMsg("/entrar", "ok", "Conta criada! Enviamos um link de confirmação para o seu e-mail."));
  }
  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/redefinir-senha`,
  });
  redirect(withMsg("/esqueci-senha", "ok", "Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha."));
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect(withMsg("/redefinir-senha", "erro", "A senha precisa ter pelo menos 8 caracteres."));
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(withMsg("/redefinir-senha", "erro", "O link expirou. Peça um novo."));
  redirect(withMsg("/entrar", "ok", "Senha atualizada. Entre com a nova senha."));
}
