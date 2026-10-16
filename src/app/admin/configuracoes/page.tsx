import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { type FlashParams } from "@/lib/flash";
import { Card, Field, Flash, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveSettings } from "../actions";
import type { Settings } from "@/lib/types";

export const metadata: Metadata = { title: "Configurações" };

export default async function AdminSettings({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");
  const { data: s } = await supabase.from("settings").select("*").single<Settings>();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Configurações" subtitle="Regras de agendamento e cancelamento." />
      <Flash ok={ok} erro={erro} />
      <Card>
        <form action={saveSettings} className="space-y-5">
          <Field label="Duração do atendimento" hint="minutos">
            <Input name="session_minutes" type="number" min={15} max={180} defaultValue={s?.session_minutes ?? 50} />
          </Field>
          <Field label="Prazo de cancelamento com devolução do crédito" hint="horas antes do atendimento">
            <Input name="cancel_window_hours" type="number" min={0} defaultValue={s?.cancel_window_hours ?? 24} />
          </Field>
          <p className="-mt-3 text-sm text-muted">
            Cancelou antes desse prazo: o crédito volta. Depois do prazo, ou em caso de falta, o atendimento é consumido.
            Use 0 para sempre devolver.
          </p>
          <Field label="Antecedência mínima para agendar" hint="horas">
            <Input name="min_notice_hours" type="number" min={0} defaultValue={s?.min_notice_hours ?? 2} />
          </Field>
          <Field label="Agenda aberta para os próximos" hint="dias">
            <Input name="booking_horizon_days" type="number" min={1} max={90} defaultValue={s?.booking_horizon_days ?? 21} />
          </Field>
          <Field label="Agendamentos simultâneos por cliente" hint="atendimentos futuros ao mesmo tempo">
            <Input name="max_open_appointments" type="number" min={1} defaultValue={s?.max_open_appointments ?? 1} />
          </Field>
          <SubmitButton>Salvar</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
