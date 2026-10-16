"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_PLANS } from "@/lib/demo/data";
import { money, sessionsLabel } from "@/lib/format";
import { Button, Card, PageHeader } from "@/components/ui";
import type { Plan } from "@/lib/types";
import { useDemo } from "../../store";

export default function DemoPlans() {
  const { buyPlan, plan: current } = useDemo();
  const router = useRouter();
  const [checkout, setCheckout] = useState<Plan | null>(null);

  if (checkout) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Pagamento" subtitle="Revise seu plano antes de pagar." />
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">{checkout.name}</h2>
              <p className="text-sm text-muted">{checkout.description}</p>
              <p className="mt-2 text-sm font-semibold text-primary-dark">
                {sessionsLabel(checkout.sessions_included)} ·{" "}
                {checkout.kind === "subscription" ? `renova a cada ${checkout.duration_days} dias` : `válido por ${checkout.duration_days} dias`}
              </p>
            </div>
            <p className="text-2xl font-extrabold">{money(checkout.price_cents)}</p>
          </div>
          <div className="mt-6 rounded-2xl bg-sand p-4 text-sm">
            <p className="font-bold">Formas de pagamento</p>
            <p className="text-muted">PIX, cartão de crédito ou boleto.</p>
            <p className="mt-2 rounded-xl bg-peach-soft px-3 py-2 font-semibold text-peach">
              Demonstração: o pagamento é simulado e aprovado na hora.
            </p>
          </div>
          <Button
            className="mt-6 w-full py-3 text-base"
            onClick={() => {
              buyPlan(checkout.id);
              router.push("/demo/cliente");
            }}
          >
            Simular pagamento aprovado
          </Button>
          <button onClick={() => setCheckout(null)} className="mt-4 w-full text-sm font-bold text-muted hover:text-ink">
            ← Voltar aos planos
          </button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Planos" subtitle="Assinatura mensal ou atendimento avulso: você escolhe." />
      {[
        { title: "Assinatura mensal", items: DEMO_PLANS.filter((p) => p.kind === "subscription") },
        { title: "Avulso", items: DEMO_PLANS.filter((p) => p.kind === "package") },
      ].map((group) => (
        <section key={group.title} className="mb-8">
          <h2 className="mb-3 text-lg font-bold">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((p) => (
              <Card key={p.id} className={`flex flex-col ${p.highlighted ? "ring-2 ring-primary" : ""}`}>
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted">{p.description}</p>
                <p className="mt-4 text-3xl font-extrabold">
                  {money(p.price_cents)}
                  {p.kind === "subscription" && <span className="text-base font-semibold text-muted">/mês</span>}
                </p>
                <p className="text-sm font-semibold text-primary-dark">{sessionsLabel(p.sessions_included)}</p>
                <Button className="mt-5" variant={p.highlighted ? "primary" : "secondary"} onClick={() => setCheckout(p)}>
                  {current?.id === p.id ? "Renovar" : p.kind === "subscription" ? "Assinar" : "Comprar"}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
