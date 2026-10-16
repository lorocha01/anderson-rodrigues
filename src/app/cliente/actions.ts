"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorText, withMsg } from "@/lib/flash";
import type { Plan } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Compra de plano. Em modo "mock" o pagamento é aprovado na hora.
 * Ao integrar o gateway, esta ação cria a cobrança e o webhook ativa o plano.
 */
export async function purchasePlan(formData: FormData) {
  const { profile } = await requireRole("client");
  const planId = String(formData.get("plan_id") ?? "");
  const back = `/cliente/planos/${planId}`;

  if (process.env.PAYMENTS_MODE !== "mock") {
    redirect(withMsg(back, "erro", "Pagamentos ainda não estão disponíveis."));
  }

  const admin = createAdminClient();
  const { data: plan } = await admin.from("plans").select("*").eq("id", planId).eq("active", true).single<Plan>();
  if (!plan) redirect(withMsg("/cliente/planos", "erro", "Plano não encontrado."));

  // Assinatura nova começa quando a atual terminar (renovação antecipada).
  let startsAt = new Date();
  if (plan.kind === "subscription") {
    const { data: last } = await admin
      .from("memberships")
      .select("ends_at")
      .eq("client_id", profile.id)
      .eq("kind", "subscription")
      .eq("status", "active")
      .gt("ends_at", startsAt.toISOString())
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ ends_at: string }>();
    if (last) startsAt = new Date(last.ends_at);
  }
  const endsAt = new Date(startsAt.getTime() + plan.duration_days * DAY);

  const { data: membership, error } = await admin
    .from("memberships")
    .insert({
      client_id: profile.id,
      plan_id: plan.id,
      kind: plan.kind,
      plan_name: plan.name,
      sessions_total: plan.sessions_included,
      price_cents: plan.price_cents,
      status: "active",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !membership) redirect(withMsg(back, "erro", errorText(error)));

  await admin.from("payments").insert({
    membership_id: membership.id,
    client_id: profile.id,
    amount_cents: plan.price_cents,
    status: "paid",
    provider: "mock",
    paid_at: new Date().toISOString(),
  });

  revalidatePath("/cliente");
  redirect(withMsg("/cliente", "ok", `Pagamento aprovado! Plano ${plan.name} ativo.`));
}

export async function submitTriage(categoryId: string, optionIds: string[]) {
  const { supabase } = await requireRole("client");
  const { data, error } = await supabase.rpc("submit_triage", {
    p_category_id: categoryId,
    p_option_ids: optionIds,
  });
  if (error) return { error: errorText(error) };
  redirect(`/cliente/agendar/${data as string}`);
}

export async function bookAppointment(formData: FormData) {
  const { supabase } = await requireRole("client");
  const triageId = String(formData.get("triage_id") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const psychologistId = String(formData.get("psychologist_id") ?? "") || null;

  const { error } = await supabase.rpc("book_appointment", {
    p_triage_id: triageId,
    p_starts_at: startsAt,
    p_psychologist_id: psychologistId,
  });
  if (error) redirect(withMsg(`/cliente/agendar/${triageId}`, "erro", errorText(error)));

  revalidatePath("/cliente");
  redirect(withMsg("/cliente/atendimentos", "ok", "Atendimento agendado! O link da chamada já está disponível abaixo."));
}

export async function cancelAppointment(formData: FormData) {
  const { supabase } = await requireRole("client");
  const id = String(formData.get("appointment_id") ?? "");
  const { data: refunded, error } = await supabase.rpc("cancel_appointment", { p_appointment_id: id, p_reason: null });
  if (error) redirect(withMsg("/cliente/atendimentos", "erro", errorText(error)));

  revalidatePath("/cliente");
  redirect(
    withMsg(
      "/cliente/atendimentos",
      "ok",
      refunded
        ? "Atendimento cancelado e o crédito voltou para o seu plano."
        : "Atendimento cancelado. Como foi fora do prazo, o crédito foi consumido.",
    ),
  );
}
