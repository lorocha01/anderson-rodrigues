import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { Card, PageHeader, RiskBadge } from "@/components/ui";
import type { Appointment, Category, Triage } from "@/lib/types";

export default async function AdminDashboard() {
  const { supabase } = await requireRole("admin");
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 3600_000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [members, next7, done, risks, psys, openTriages, categories, upcoming] = await Promise.all([
    supabase.from("membership_balances").select("client_id").eq("is_current", true),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "scheduled").gte("starts_at", now.toISOString()).lte("starts_at", in7),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed").gte("starts_at", monthStart),
    supabase.from("triages").select("*").gt("risk_level", 0).is("reviewed_at", null).order("risk_level", { ascending: false }).order("created_at", { ascending: false }).limit(5).returns<Triage[]>(),
    supabase.from("psychologists").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("triages").select("category_id").eq("status", "open"),
    supabase.from("categories").select("*").order("sort_order").returns<Category[]>(),
    supabase.from("appointments").select("category_id").eq("status", "scheduled").gte("starts_at", now.toISOString()).returns<Pick<Appointment, "category_id">[]>(),
  ]);

  const activeClients = new Set((members.data ?? []).map((m) => m.client_id)).size;
  const countBy = (rows: { category_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const r of rows ?? []) map.set(r.category_id, (map.get(r.category_id) ?? 0) + 1);
    return map;
  };
  const waiting = countBy(openTriages.data as { category_id: string }[] | null);
  const scheduled = countBy(upcoming.data);
  const catName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));

  const stats = [
    { label: "Clientes com plano ativo", value: activeClients, href: "/admin/clientes" },
    { label: "Atendimentos nos próximos 7 dias", value: next7.count ?? 0, href: "/admin/atendimentos" },
    { label: "Realizados neste mês", value: done.count ?? 0, href: "/admin/relatorios" },
    { label: "Psicólogos ativos", value: psys.count ?? 0, href: "/admin/psicologos" },
  ];

  return (
    <>
      <PageHeader title="Painel" subtitle="Visão geral da AconselhA." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-3xl border border-line bg-white p-5 transition hover:border-primary">
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Alertas de risco sem acompanhamento</h2>
            <Link href="/admin/triagens" className="text-sm font-bold text-primary">Ver todos</Link>
          </div>
          {(risks.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nenhum alerta pendente.</p>
          ) : (
            <ul className="space-y-3">
              {(risks.data ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {catName.get(t.category_id)} · <span className="text-muted">{dateTime(t.created_at)}</span>
                  </span>
                  <RiskBadge level={t.risk_level} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-bold">Demanda por categoria</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="pb-2 font-semibold">Categoria</th>
                <th className="pb-2 text-right font-semibold">Aguardando</th>
                <th className="pb-2 text-right font-semibold">Agendados</th>
              </tr>
            </thead>
            <tbody>
              {(categories.data ?? []).map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="py-2">{c.icon} {c.name}</td>
                  <td className="py-2 text-right font-bold">{waiting.get(c.id) ?? 0}</td>
                  <td className="py-2 text-right font-bold">{scheduled.get(c.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">"Aguardando" = triagem feita, ainda sem horário marcado.</p>
        </Card>
      </div>
    </>
  );
}
