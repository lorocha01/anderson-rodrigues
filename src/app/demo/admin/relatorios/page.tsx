import { DEMO_PSYCHOLOGISTS, DEMO_REPORT } from "@/lib/demo/data";
import { money } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";

export default function DemoAdminReports() {
  const total = (k: "completed" | "noShow" | "canceled") => DEMO_REPORT.reduce((s, r) => s + r[k], 0);
  return (
    <>
      <PageHeader title="Relatórios" subtitle="Atendimentos por profissional no mês, para o repasse feito fora da plataforma." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Receita (pagamentos aprovados)", value: money(1189430) },
          { label: "Vendas no mês", value: 142 },
          { label: "Atendimentos realizados", value: total("completed") },
          { label: "Faltas", value: total("noShow") },
        ].map((s) => (
          <Card key={s.label} className="!p-5">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-x-auto !p-0">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-sand text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Profissional</th>
              <th className="px-4 py-3 text-right font-semibold">Realizados</th>
              <th className="px-4 py-3 text-right font-semibold">Faltas</th>
              <th className="px-4 py-3 text-right font-semibold">Cancelados</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_REPORT.map((r) => {
              const p = DEMO_PSYCHOLOGISTS.find((x) => x.id === r.id)!;
              return (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <span className="font-semibold">{p.display_name}</span> <span className="text-muted">· CRP {p.crp}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{r.completed}</td>
                  <td className="px-4 py-3 text-right">{r.noShow}</td>
                  <td className="px-4 py-3 text-right">{r.canceled}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-sm text-muted">Números fictícios para demonstração.</p>
    </>
  );
}
