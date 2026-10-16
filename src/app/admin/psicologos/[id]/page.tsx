import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEEKDAYS } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { Card, Field, Flash, Input, PageHeader, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updatePsychologist } from "../../actions";
import type { AvailabilityRule, Category, Psychologist } from "@/lib/types";

export const metadata: Metadata = { title: "Psicólogo(a)" };

export default async function AdminPsychologist({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: FlashParams }) {
  const { id } = await params;
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");
  const [{ data: psy }, { data: categories }, { data: links }, { data: rules }, { count: done }] = await Promise.all([
    createAdminClient().from("psychologists").select("*").eq("id", id).maybeSingle<Psychologist>(),
    supabase.from("categories").select("*").order("sort_order").returns<Category[]>(),
    supabase.from("psychologist_categories").select("category_id").eq("psychologist_id", id),
    supabase.from("availability_rules").select("*").eq("psychologist_id", id).order("weekday").order("start_time").returns<AvailabilityRule[]>(),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("psychologist_id", id).eq("status", "completed"),
  ]);
  if (!psy) notFound();
  const selected = new Set((links ?? []).map((l) => l.category_id as string));

  return (
    <>
      <PageHeader title={psy.display_name} subtitle={`CRP ${psy.crp} · ${done ?? 0} atendimentos realizados`} />
      <Flash ok={ok} erro={erro} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <form action={updatePsychologist} className="space-y-5">
            <input type="hidden" name="id" value={psy.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome de exibição">
                <Input name="display_name" defaultValue={psy.display_name} required />
              </Field>
              <Field label="CRP">
                <Input name="crp" defaultValue={psy.crp} required />
              </Field>
            </div>
            <Field label="Link fixo do Google Meet">
              <Input name="meet_url" type="url" defaultValue={psy.meet_url ?? ""} placeholder="https://meet.google.com/..." />
            </Field>
            <Field label="Abordagem">
              <Input name="approach" defaultValue={psy.approach} />
            </Field>
            <Field label="Sobre">
              <Textarea name="bio" defaultValue={psy.bio} />
            </Field>
            <div>
              <span className="mb-1.5 block text-sm font-bold">Atende em</span>
              <div className="grid gap-1 sm:grid-cols-2">
                {(categories ?? []).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="category_id" value={c.id} defaultChecked={selected.has(c.id)} className="size-4 accent-primary" />
                    {c.icon} {c.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="active" defaultChecked={psy.active} className="size-4 accent-primary" />
              Habilitado (aparece para os clientes)
            </label>
            <SubmitButton>Salvar</SubmitButton>
          </form>
        </Card>

        <Card className="h-fit">
          <h2 className="mb-3 font-bold">Disponibilidade semanal</h2>
          {(rules ?? []).length === 0 ? (
            <p className="text-sm text-muted">Ainda não cadastrada pelo profissional.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(rules ?? []).map((r) => (
                <li key={r.id}>
                  <span className="font-semibold">{WEEKDAYS[r.weekday]}</span> {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
