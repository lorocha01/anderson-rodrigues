"use client";

import Link from "next/link";
import { DEMO_CATEGORIES, DEMO_PSYCHOLOGISTS } from "@/lib/demo/data";
import { dateTime } from "@/lib/format";
import { Card, PageHeader, RiskBadge } from "@/components/ui";
import { useDemo } from "../store";
import { demoRows } from "../rows";

export default function DemoAdminDashboard() {
  const { state } = useDemo();
  const rows = demoRows(state);
  const now = Date.now();
  const in7 = now + 7 * 864e5;
  const scheduled = rows.filter((r) => r.status === "scheduled" && new Date(r.startsAt).getTime() > now);
  const alerts = rows.filter((r) => r.riskLevel > 0).reverse();
  const waiting = state.triages.filter((t) => t.status === "open");

  const stats = [
    { label: "Clientes com plano ativo", value: 128 + (state.membership ? 1 : 0) },
    { label: "Atendimentos nos próximos 7 dias", value: scheduled.filter((r) => new Date(r.startsAt).getTime() <= in7).length },
    { label: "Realizados neste mês", value: 101 },
    { label: "Psicólogos ativos", value: DEMO_PSYCHOLOGISTS.length },
  ];

  return (
    <>
      <PageHeader title="Painel" subtitle="Visão geral da AconselhA." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-line bg-white p-5">
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold">Alertas de risco sem acompanhamento</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted">Nenhum alerta pendente.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="font-semibold">{r.clientName}</span> · {DEMO_CATEGORIES.find((c) => c.id === r.categoryId)?.name}
                    <span className="text-muted"> · {dateTime(r.startsAt)}</span>
                  </span>
                  <RiskBadge level={r.riskLevel} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">
            Quando o cliente indica risco na triagem, o caso aparece aqui para a equipe entrar em contato.
          </p>
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
              {DEMO_CATEGORIES.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="py-2">{c.icon} {c.name}</td>
                  <td className="py-2 text-right font-bold">{waiting.filter((t) => t.categoryId === c.id).length}</td>
                  <td className="py-2 text-right font-bold">{scheduled.filter((r) => r.categoryId === c.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">&quot;Aguardando&quot; = triagem feita, ainda sem horário marcado.</p>
        </Card>
      </div>
      <p className="mt-6 text-sm text-muted">
        Próximos passos da gestão: <Link href="/demo/admin/psicologos" className="font-bold text-primary">psicólogos</Link>,{" "}
        <Link href="/demo/admin/triagem" className="font-bold text-primary">perguntas da triagem</Link> e{" "}
        <Link href="/demo/admin/relatorios" className="font-bold text-primary">relatórios</Link>.
      </p>
    </>
  );
}
