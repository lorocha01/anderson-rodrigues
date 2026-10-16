import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { dateShort, money, sessionsLabel } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { ButtonLink, Card, Flash, PageHeader, StatusBadge } from "@/components/ui";
import type { MembershipBalance, Plan } from "@/lib/types";

export const metadata: Metadata = { title: "Planos" };

export default async function PlansPage({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("client");
  const [{ data: plans }, { data: history }] = await Promise.all([
    supabase.from("plans").select("*").eq("active", true).order("sort_order").returns<Plan[]>(),
    supabase.from("membership_balances").select("*").order("created_at", { ascending: false }).returns<MembershipBalance[]>(),
  ]);

  const subscriptions = (plans ?? []).filter((p) => p.kind === "subscription");
  const packages = (plans ?? []).filter((p) => p.kind === "package");

  return (
    <>
      <PageHeader title="Planos" subtitle="Assinatura mensal ou atendimento avulso: você escolhe." />
      <Flash ok={ok} erro={erro} />

      {[{ title: "Assinatura mensal", items: subscriptions }, { title: "Avulso", items: packages }].map(
        (group) =>
          group.items.length > 0 && (
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
                    <p className="text-sm font-semibold text-primary-dark">
                      {sessionsLabel(p.sessions_included)} · {p.kind === "subscription" ? `ciclo de ${p.duration_days} dias` : `válido por ${p.duration_days} dias`}
                    </p>
                    <ButtonLink href={`/cliente/planos/${p.id}`} className="mt-5" variant={p.highlighted ? "primary" : "secondary"}>
                      {p.kind === "subscription" ? "Assinar" : "Comprar"}
                    </ButtonLink>
                  </Card>
                ))}
              </div>
            </section>
          ),
      )}

      {history && history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Histórico</h2>
          <Card className="divide-y divide-line !p-0">
            {history.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="font-semibold">{m.plan_name}</span>
                <span className="text-muted">
                  {m.starts_at && dateShort(m.starts_at)} a {m.ends_at && dateShort(m.ends_at)} ·{" "}
                  {m.sessions_total === null ? "livre" : `${m.sessions_used}/${m.sessions_total} usados`}
                </span>
                <StatusBadge status={m.is_current ? "active" : m.status === "active" ? "expired" : m.status} />
              </div>
            ))}
          </Card>
        </section>
      )}
    </>
  );
}
