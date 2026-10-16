"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { errorText, withMsg } from "@/lib/flash";

export async function setOutcome(formData: FormData) {
  const { supabase } = await requireRole("psychologist");
  const id = String(formData.get("appointment_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const { error } = await supabase.rpc("set_appointment_outcome", { p_appointment_id: id, p_status: status });
  if (error) redirect(withMsg("/psicologo", "erro", errorText(error)));
  revalidatePath("/psicologo");
  redirect(withMsg("/psicologo", "ok", status === "completed" ? "Atendimento registrado como realizado." : "Falta registrada."));
}

export async function cancelByPsychologist(formData: FormData) {
  const { supabase } = await requireRole("psychologist");
  const id = String(formData.get("appointment_id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const { error } = await supabase.rpc("cancel_appointment", { p_appointment_id: id, p_reason: reason });
  if (error) redirect(withMsg("/psicologo", "erro", errorText(error)));
  revalidatePath("/psicologo");
  redirect(withMsg("/psicologo", "ok", "Atendimento cancelado. O crédito voltou para o cliente."));
}

export async function addAvailability(formData: FormData) {
  const { profile, supabase } = await requireRole("psychologist");
  const weekdays = formData.getAll("weekday").map(Number).filter((d) => d >= 0 && d <= 6);
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  const back = "/psicologo/disponibilidade";

  if (weekdays.length === 0) redirect(withMsg(back, "erro", "Escolha pelo menos um dia da semana."));
  if (!start || !end || end <= start) redirect(withMsg(back, "erro", "O horário final precisa ser depois do inicial."));

  const { error } = await supabase.from("availability_rules").insert(
    weekdays.map((weekday) => ({ psychologist_id: profile.id, weekday, start_time: start, end_time: end })),
  );
  if (error) redirect(withMsg(back, "erro", errorText(error)));
  revalidatePath(back);
  redirect(withMsg(back, "ok", "Disponibilidade adicionada."));
}

export async function removeAvailability(formData: FormData) {
  const { supabase } = await requireRole("psychologist");
  const id = String(formData.get("id") ?? "");
  await supabase.from("availability_rules").delete().eq("id", id);
  revalidatePath("/psicologo/disponibilidade");
  redirect("/psicologo/disponibilidade");
}

export async function updateMyProfile(formData: FormData) {
  const { profile, supabase } = await requireRole("psychologist");
  const meetUrl = String(formData.get("meet_url") ?? "").trim();
  if (meetUrl && !/^https:\/\//.test(meetUrl)) {
    redirect(withMsg("/psicologo/perfil", "erro", "O link da sala precisa começar com https://"));
  }
  const { error } = await supabase
    .from("psychologists")
    .update({
      bio: String(formData.get("bio") ?? "").trim(),
      approach: String(formData.get("approach") ?? "").trim(),
      photo_url: String(formData.get("photo_url") ?? "").trim() || null,
      meet_url: meetUrl || null,
    })
    .eq("id", profile.id);
  if (error) redirect(withMsg("/psicologo/perfil", "erro", errorText(error)));
  revalidatePath("/psicologo/perfil");
  redirect(withMsg("/psicologo/perfil", "ok", "Perfil atualizado."));
}
