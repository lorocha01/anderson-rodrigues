import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { money, sessionsLabel } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { Card, Flash, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { purchasePlan } from "../../actions";
import type { Plan } from "@/lib/types";

export const metadata: Metadata = { title: "Pagamento" };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ planId: string }>; searchParams: FlashParams }) {
  const { planId } = await params;
  const { erro } = await searchParams;
  const { supabase } = await requireRole("client");
  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).eq("active", true).maybeSingle<Plan>();
  if (!plan) notFound();

  const mock = process.env.PAYMENTS_MODE === "mock";

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Pagamento" subtitle="Revise seu plano antes de pagar." />
      <Flash erro={erro} />
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
            <p className="text-sm text-muted">{plan.description}</p>
            <p className="mt-2 text-sm font-semibold text-primary-dark">
              {sessionsLabel(plan.sessions_included)} ·{" "}
              {plan.kind === "subscription" ? `renova a cada ${plan.duration_days} dias` : `válido por ${plan.duration_days} dias`}
            </p>
          </div>
          <p className="text-2xl font-extrabold">{money(plan.price_cents)}</p>
        </div>

        <div className="mt-6 rounded-2xl bg-sand p-4 text-sm">
          <p className="font-bold">Formas de pagamento</p>
          <p className="text-muted">PIX, cartão de crédito ou boleto.</p>
          {mock && (
            <p className="mt-2 rounded-xl bg-peach-soft px-3 py-2 font-semibold text-peach">
              Ambiente de demonstração: o pagamento é simulado e aprovado na hora.
            </p>
          )}
        </div>

        <form action={purchasePlan} className="mt-6">
          <input type="hidden" name="plan_id" value={plan.id} />
          <SubmitButton className="w-full py-3 text-base" pendingText="Processando…">
            {mock ? "Simular pagamento aprovado" : `Pagar ${money(plan.price_cents)}`}
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
