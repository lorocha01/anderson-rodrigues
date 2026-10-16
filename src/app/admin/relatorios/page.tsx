import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import type { Appointment } from "@/lib/types";

export const metadata: Metadata = { title: "Relatórios" };

/** Limites do mês (yyyy-mm) no horário de Brasília. */
function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  return { start: `${month}-01T00:00:00-03:00`, end: `${next}-01T00:00:00-03:00` };
}

function currentMonth() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
}

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  const month = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : currentMonth();
  const { start, end } = monthRange(month);
  const { supabase } = await requireRole("admin");

  const [{ data: appointments }, { data: psys }, { data: payments }] = await Promise.all([
    supabase.from("appointments").select("psychologist_id, status, credit_refunded").gte("starts_at", start).lt("starts_at", end)
      .returns<Pick<Appointment, "psychologist_id" | "status" | "credit_refunded">[]>(),
    supabase.from("psychologists").select("id, display_name, crp").order("display_name"),
    supabase.from("payments").select("amount_cents, membership_id").eq("status", "paid").gte("paid_at", start).lt("paid_at", end),
  ]);

  const rows = (psys ?? []).map((p) => {
    const mine = (appointments ?? []).filter((a) => a.psychologist_id === p.id);
    return {
      id: p.id as string,
      name: p.display_name as string,
      crp: p.crp as string,
      completed: mine.filter((a) => a.status === "completed").length,
      noShow: mine.filter((a) => a.status === "no_show").length,
      canceled: mine.filter((a) => a.status === "canceled").length,
      pending: mine.filter((a) => a.status === "scheduled").length,
    };
  }).filter((r) => r.completed + r.noShow + r.canceled + r.pending > 0);

  const revenue = (payments ?? []).reduce((sum, p) => sum + (p.amount_cents as number), 0);
  const total = (k: "completed" | "noShow" | "canceled" | "pending") => rows.reduce((s, r) => s + r[k], 0);

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Atendimentos por profissional no mês, para o repasse feito fora da plataforma."
        action={
          <form className="flex items-center gap-2">
            <Input type="month" name="mes" defaultValue={month} className="!w-auto" />
            <Button variant="secondary" type="submit">Ver</Button>
          </form>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Receita (pagamentos aprovados)", value: money(revenue) },
          { label: "Vendas no mês", value: payments?.length ?? 0 },
          { label: "Atendimentos realizados", value: total("completed") },
          { label: "Faltas", value: total("noShow") },
        ].map((s) => (
          <Card key={s.label} className="!p-5">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum atendimento neste mês" />
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-sand text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Profissional</th>
                <th className="px-4 py-3 text-right font-semibold">Realizados</th>
                <th className="px-4 py-3 text-right font-semibold">Faltas</th>
                <th className="px-4 py-3 text-right font-semibold">Cancelados</th>
                <th className="px-4 py-3 text-right font-semibold">A realizar / sem registro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <span className="font-semibold">{r.name}</span> <span className="text-muted">· CRP {r.crp}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{r.completed}</td>
                  <td className="px-4 py-3 text-right">{r.noShow}</td>
                  <td className="px-4 py-3 text-right">{r.canceled}</td>
                  <td className="px-4 py-3 text-right">{r.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
