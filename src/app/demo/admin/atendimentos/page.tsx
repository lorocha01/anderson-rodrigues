"use client";

import { DEMO_CATEGORIES, DEMO_PSYCHOLOGISTS } from "@/lib/demo/data";
import { dateShort, time } from "@/lib/format";
import { Badge, Card, PageHeader, StatusBadge } from "@/components/ui";
import { useDemo } from "../../store";
import { demoRows } from "../../rows";

export default function DemoAdminAppointments() {
  const { state } = useDemo();
  const rows = demoRows(state).reverse();
  return (
    <>
      <PageHeader title="Atendimentos" subtitle="Todos os atendimentos da plataforma, com filtros por status na versão real." />
      <Card className="overflow-x-auto !p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-sand text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Psicólogo(a)</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{dateShort(r.startsAt)} {time(r.startsAt)}</td>
                <td className="px-4 py-3">
                  {r.clientName} {r.mine && <Badge tone="lilac">você</Badge>}
                </td>
                <td className="px-4 py-3">{DEMO_PSYCHOLOGISTS.find((p) => p.id === r.psychologistId)?.display_name}</td>
                <td className="px-4 py-3">{DEMO_CATEGORIES.find((c) => c.id === r.categoryId)?.name}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
