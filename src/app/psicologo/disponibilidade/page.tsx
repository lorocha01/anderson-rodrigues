import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { WEEKDAYS } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { Card, Field, Flash, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { addAvailability, removeAvailability } from "../actions";
import type { AvailabilityRule, Settings } from "@/lib/types";

export const metadata: Metadata = { title: "Disponibilidade" };

export default async function AvailabilityPage({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { profile, supabase } = await requireRole("psychologist");
  const [{ data: rules }, { data: settings }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("psychologist_id", profile.id).order("weekday").order("start_time").returns<AvailabilityRule[]>(),
    supabase.from("settings").select("*").single<Settings>(),
  ]);

  return (
    <>
      <PageHeader
        title="Disponibilidade"
        subtitle={`Horários semanais em que você atende (horário de Brasília). Cada atendimento dura ${settings?.session_minutes ?? 50} minutos.`}
      />
      <Flash ok={ok} erro={erro} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="!p-0">
          {WEEKDAYS.map((label, day) => {
            const dayRules = (rules ?? []).filter((r) => r.weekday === day);
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 last:border-0">
                <span className="w-24 font-bold">{label}</span>
                {dayRules.length === 0 ? (
                  <span className="text-sm text-muted">Sem atendimento</span>
                ) : (
                  dayRules.map((r) => (
                    <form key={r.id} action={removeAvailability} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-3 pr-1 text-sm font-bold text-primary-dark">
                      {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                      <input type="hidden" name="id" value={r.id} />
                      <button aria-label="Remover" className="rounded-full px-2 hover:bg-white">×</button>
                    </form>
                  ))
                )}
              </div>
            );
          })}
        </Card>

        <Card>
          <h2 className="mb-4 font-bold">Adicionar horário</h2>
          <form action={addAvailability} className="space-y-4">
            <div>
              <span className="mb-1.5 block text-sm font-bold">Dias da semana</span>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((label, day) => (
                  <label key={day} className="cursor-pointer">
                    <input type="checkbox" name="weekday" value={day} className="peer sr-only" defaultChecked={day >= 1 && day <= 5} />
                    <span className="block rounded-full border border-line px-3 py-1.5 text-sm font-bold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white">
                      {label.slice(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <Input type="time" name="start_time" defaultValue="09:00" required />
              </Field>
              <Field label="Fim">
                <Input type="time" name="end_time" defaultValue="12:00" required />
              </Field>
            </div>
            <SubmitButton className="w-full">Adicionar</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
