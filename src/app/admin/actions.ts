"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorText, withMsg } from "@/lib/flash";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};

function done(path: string, message: string): never {
  revalidatePath(path);
  redirect(withMsg(path, "ok", message));
}

// ---------------------------------------------------------------------------
// Psicólogos (service_role: cria usuário e lê/edita colunas restritas)
// ---------------------------------------------------------------------------
export async function createPsychologist(formData: FormData) {
  await requireRole("admin");
  const back = "/admin/psicologos";
  const name = str(formData, "display_name");
  const email = str(formData, "email").toLowerCase();
  const crp = str(formData, "crp");
  const password = str(formData, "password");
  const categoryIds = formData.getAll("category_id").map(String);

  if (!name || !email || !crp) redirect(withMsg(back, "erro", "Preencha nome, e-mail e CRP."));
  if (password.length < 8) redirect(withMsg(back, "erro", "A senha provisória precisa ter pelo menos 8 caracteres."));

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !created.user) {
    const msg = error?.code === "email_exists" ? "Já existe um usuário com este e-mail." : errorText(error);
    redirect(withMsg(back, "erro", msg));
  }

  const id = created.user.id;
  const { error: e1 } = await admin.from("profiles").update({ role: "psychologist", full_name: name }).eq("id", id);
  const { error: e2 } = await admin.from("psychologists").insert({ id, display_name: name, crp });
  if (e1 || e2) {
    await admin.auth.admin.deleteUser(id);
    redirect(withMsg(back, "erro", errorText(e1 ?? e2)));
  }
  if (categoryIds.length) {
    await admin.from("psychologist_categories").insert(categoryIds.map((category_id) => ({ psychologist_id: id, category_id })));
  }
  revalidatePath(back);
  redirect(withMsg(`/admin/psicologos/${id}`, "ok", `${name} cadastrado(a). Envie o e-mail e a senha provisória para o primeiro acesso.`));
}

export async function updatePsychologist(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const back = `/admin/psicologos/${id}`;
  const meetUrl = str(formData, "meet_url");
  if (meetUrl && !meetUrl.startsWith("https://")) redirect(withMsg(back, "erro", "O link da sala precisa começar com https://"));

  const admin = createAdminClient();
  const { error } = await admin
    .from("psychologists")
    .update({
      display_name: str(formData, "display_name"),
      crp: str(formData, "crp"),
      approach: str(formData, "approach"),
      bio: str(formData, "bio"),
      meet_url: meetUrl || null,
      active: formData.get("active") === "on",
    })
    .eq("id", id);
  if (error) redirect(withMsg(back, "erro", errorText(error)));

  const categoryIds = formData.getAll("category_id").map(String);
  await admin.from("psychologist_categories").delete().eq("psychologist_id", id);
  if (categoryIds.length) {
    await admin.from("psychologist_categories").insert(categoryIds.map((category_id) => ({ psychologist_id: id, category_id })));
  }
  revalidatePath("/admin/psicologos");
  done(back, "Dados salvos.");
}

export async function togglePsychologist(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const active = formData.get("active") === "true";
  await createAdminClient().from("psychologists").update({ active }).eq("id", id);
  done("/admin/psicologos", active ? "Psicólogo(a) habilitado(a)." : "Psicólogo(a) desabilitado(a).");
}

export async function cancelAsAdmin(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = str(formData, "appointment_id");
  const { error } = await supabase.rpc("cancel_appointment", { p_appointment_id: id, p_reason: "Cancelado pela administração" });
  if (error) redirect(withMsg("/admin/atendimentos", "erro", errorText(error)));
  done("/admin/atendimentos", "Atendimento cancelado e crédito devolvido.");
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------
function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) redirect(withMsg("/admin/categorias", "erro", "Informe o nome da categoria."));
  const values = {
    name,
    description: str(formData, "description"),
    icon: str(formData, "icon") || "💬",
    sort_order: int(formData, "sort_order"),
    active: formData.get("active") === "on",
  };
  const { error } = id
    ? await supabase.from("categories").update(values).eq("id", id)
    : await supabase.from("categories").insert({ ...values, slug: `${slugify(name)}-${Date.now().toString(36)}` });
  if (error) redirect(withMsg("/admin/categorias", "erro", errorText(error)));
  done("/admin/categorias", id ? "Categoria atualizada." : "Categoria criada. Monte a árvore de perguntas dela na Triagem.");
}

// ---------------------------------------------------------------------------
// Planos
// ---------------------------------------------------------------------------
export async function savePlan(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = str(formData, "id");
  const name = str(formData, "name");
  const price = Number.parseFloat(str(formData, "price").replace(/\./g, "").replace(",", "."));
  const sessionsRaw = str(formData, "sessions_included");
  const kind = str(formData, "kind") === "package" ? "package" : "subscription";
  if (!name || !Number.isFinite(price) || price < 0) redirect(withMsg("/admin/planos", "erro", "Informe nome e preço válidos."));

  const values = {
    name,
    description: str(formData, "description"),
    kind,
    sessions_included: sessionsRaw ? Math.max(1, int(formData, "sessions_included", 1)) : null,
    price_cents: Math.round(price * 100),
    duration_days: Math.max(1, int(formData, "duration_days", 30)),
    highlighted: formData.get("highlighted") === "on",
    active: formData.get("active") === "on",
    sort_order: int(formData, "sort_order"),
  };
  const { error } = id
    ? await supabase.from("plans").update(values).eq("id", id)
    : await supabase.from("plans").insert(values);
  if (error) redirect(withMsg("/admin/planos", "erro", errorText(error)));
  done("/admin/planos", id ? "Plano atualizado." : "Plano criado.");
}

// ---------------------------------------------------------------------------
// Árvore de triagem
// ---------------------------------------------------------------------------
function triagePath(categoryId: string | null) {
  return `/admin/triagem/${categoryId ?? "risco"}`;
}

export async function saveQuestion(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = str(formData, "id");
  const categoryId = str(formData, "category_id") || null;
  const back = triagePath(categoryId);
  const text = str(formData, "text");
  if (!text) redirect(withMsg(back, "erro", "Escreva a pergunta."));
  const values = { text, help_text: str(formData, "help_text"), sort_order: int(formData, "sort_order") };

  if (id) {
    const { error } = await supabase.from("triage_questions").update(values).eq("id", id);
    if (error) redirect(withMsg(back, "erro", errorText(error)));
    done(back, "Pergunta atualizada.");
  }

  // A primeira pergunta de uma categoria vira a inicial automaticamente.
  let isRoot = false;
  if (categoryId) {
    const { count } = await supabase.from("triage_questions").select("id", { count: "exact", head: true }).eq("category_id", categoryId);
    isRoot = (count ?? 0) === 0;
  }
  const { error } = await supabase.from("triage_questions").insert({ ...values, category_id: categoryId, is_root: isRoot });
  if (error) redirect(withMsg(back, "erro", errorText(error)));
  done(back, "Pergunta criada. Agora adicione as opções de resposta.");
}

export async function setRootQuestion(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = str(formData, "id");
  const categoryId = str(formData, "category_id");
  const back = triagePath(categoryId);
  await supabase.from("triage_questions").update({ is_root: false }).eq("category_id", categoryId).eq("is_root", true);
  const { error } = await supabase.from("triage_questions").update({ is_root: true }).eq("id", id);
  if (error) redirect(withMsg(back, "erro", errorText(error)));
  done(back, "Pergunta inicial definida.");
}

export async function deleteQuestion(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = str(formData, "id");
  const categoryId = str(formData, "category_id") || null;
  const { error } = await supabase.from("triage_questions").delete().eq("id", id);
  if (error) redirect(withMsg(triagePath(categoryId), "erro", errorText(error)));
  done(triagePath(categoryId), "Pergunta removida.");
}

export async function saveOption(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const id = str(formData, "id");
  const back = triagePath(str(formData, "category_id") || null);
  const label = str(formData, "label");
  if (!label) redirect(withMsg(back, "erro", "Escreva o texto da opção."));
  const values = {
    label,
    next_question_id: str(formData, "next_question_id") || null,
    risk_level: Math.min(2, Math.max(0, int(formData, "risk_level"))),
    sort_order: int(formData, "sort_order"),
  };
  const { error } = id
    ? await supabase.from("triage_options").update(values).eq("id", id)
    : await supabase.from("triage_options").insert({ ...values, question_id: str(formData, "question_id") });
  if (error) redirect(withMsg(back, "erro", errorText(error)));
  done(back, id ? "Opção atualizada." : "Opção adicionada.");
}

export async function deleteOption(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const back = triagePath(str(formData, "category_id") || null);
  await supabase.from("triage_options").delete().eq("id", str(formData, "id"));
  done(back, "Opção removida.");
}

// ---------------------------------------------------------------------------
// Triagens com risco
// ---------------------------------------------------------------------------
export async function markTriageReviewed(formData: FormData) {
  const { supabase } = await requireRole("admin");
  await supabase.from("triages").update({ reviewed_at: new Date().toISOString() }).eq("id", str(formData, "id"));
  done("/admin/triagens", "Triagem marcada como acompanhada.");
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------
export async function saveSettings(formData: FormData) {
  const { supabase } = await requireRole("admin");
  const { error } = await supabase
    .from("settings")
    .update({
      session_minutes: int(formData, "session_minutes", 50),
      cancel_window_hours: int(formData, "cancel_window_hours", 24),
      min_notice_hours: int(formData, "min_notice_hours", 2),
      booking_horizon_days: int(formData, "booking_horizon_days", 21),
      max_open_appointments: int(formData, "max_open_appointments", 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) redirect(withMsg("/admin/configuracoes", "erro", errorText(error)));
  done("/admin/configuracoes", "Configurações salvas.");
}
