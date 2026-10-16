import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { Card, Field, Flash, Input, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { savePlan } from "../actions";
import type { Plan } from "@/lib/types";

export const metadata: Metadata = { title: "Planos" };

function PlanForm({ plan }: { plan?: Plan }) {
  return (
    <form action={savePlan} className="space-y-3">
      <input type="hidden" name="id" value={plan?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nome">
          <Input name="name" defaultValue={plan?.name} required />
        </Field>
        <Field label="Tipo">
          <Select name="kind" defaultValue={plan?.kind ?? "subscription"}>
            <option value="subscription">Assinatura mensal</option>
            <option value="package">Pacote avulso</option>
          </Select>
        </Field>
        <Field label="Preço (R$)">
          <Input name="price" inputMode="decimal" defaultValue={plan ? (plan.price_cents / 100).toFixed(2).replace(".", ",") : ""} required />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Atendimentos" hint="vazio = livre">
          <Input name="sessions_included" type="number" min={1} defaultValue={plan?.sessions_included ?? ""} />
        </Field>
        <Field label="Duração / validade" hint="dias">
          <Input name="duration_days" type="number" min={1} defaultValue={plan?.duration_days ?? 30} />
        </Field>
        <Field label="Ordem">
          <Input name="sort_order" type="number" defaultValue={plan?.sort_order ?? 0} />
        </Field>
        <div className="flex items-end gap-4 pb-2.5">
          <label className="flex items-center gap-1.5 text-sm font-bold">
            <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} className="size-4 accent-primary" /> Ativo
          </label>
          <label className="flex items-center gap-1.5 text-sm font-bold">
            <input type="checkbox" name="highlighted" defaultChecked={plan?.highlighted} className="size-4 accent-primary" /> Destaque
          </label>
        </div>
      </div>
      <Field label="Descrição">
        <Input name="description" defaultValue={plan?.description} />
      </Field>
      <SubmitButton variant={plan ? "secondary" : "primary"}>{plan ? "Salvar" : "Criar plano"}</SubmitButton>
    </form>
  );
}

export default async function AdminPlans({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");
  const { data: plans } = await supabase.from("plans").select("*").order("sort_order").returns<Plan[]>();

  return (
    <>
      <PageHeader
        title="Planos"
        subtitle="Mudanças de preço valem para novas compras. Quem já comprou mantém as condições do ciclo atual."
      />
      <Flash ok={ok} erro={erro} />
      <div className="space-y-4">
        {(plans ?? []).map((p) => (
          <Card key={p.id}>
            <p className="mb-3 font-display text-lg font-semibold">
              {p.name} <span className="font-sans text-sm font-normal text-muted">· {money(p.price_cents)}</span>
            </p>
            <PlanForm plan={p} />
          </Card>
        ))}
        <Card className="border-dashed">
          <p className="mb-3 font-bold">Novo plano</p>
          <PlanForm />
        </Card>
      </div>
    </>
  );
}
