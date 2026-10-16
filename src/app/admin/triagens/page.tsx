import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { Badge, Card, EmptyState, Flash, PageHeader, RiskBadge, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { markTriageReviewed } from "../actions";
import type { Category, Profile, Triage } from "@/lib/types";

export const metadata: Metadata = { title: "Alertas de risco" };

export default async function RiskTriages({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");
  const { data: triages } = await supabase
    .from("triages")
    .select("*")
    .gt("risk_level", 0)
    .order("reviewed_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<Triage[]>();

  const list = triages ?? [];
  const [{ data: clients }, { data: categories }] = await Promise.all([
    list.length
      ? supabase.from("profiles").select("id, full_name, phone").in("id", [...new Set(list.map((t) => t.client_id))]).returns<Pick<Profile, "id" | "full_name" | "phone">[]>()
      : { data: [] },
    supabase.from("categories").select("id, name").returns<Pick<Category, "id" | "name">[]>(),
  ]);
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  const catName = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Alertas de risco"
        subtitle="Triagens em que o cliente indicou risco. Faça contato e marque como acompanhada."
      />
      <Flash ok={ok} erro={erro} />
      {list.length === 0 ? (
        <EmptyState title="Nenhum alerta" />
      ) : (
        <div className="space-y-4">
          {list.map((t) => {
            const client = clientById.get(t.client_id);
            return (
              <Card key={t.id} className={t.reviewed_at ? "opacity-70" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{client?.full_name ?? "Cliente"}</p>
                    <p className="text-sm text-muted">
                      {catName.get(t.category_id)} · {dateTime(t.created_at)}
                      {client?.phone && (
                        <>
                          {" · "}
                          <a className="font-bold text-primary" href={`tel:${client.phone.replace(/\D/g, "")}`}>{client.phone}</a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RiskBadge level={t.risk_level} />
                    <StatusBadge status={t.status} />
                    {t.reviewed_at && <Badge tone="primary">Acompanhada</Badge>}
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {t.answers.filter((a) => a.risk_level > 0).map((a, i) => (
                    <li key={i}>
                      <span className="text-muted">{a.question}</span> <span className="font-bold text-danger">{a.answer}</span>
                    </li>
                  ))}
                </ul>
                {!t.reviewed_at && (
                  <form action={markTriageReviewed} className="mt-4">
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton variant="secondary">Marcar como acompanhada</SubmitButton>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
