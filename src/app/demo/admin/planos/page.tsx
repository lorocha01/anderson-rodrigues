import { DEMO_PLANS } from "@/lib/demo/data";
import { money, sessionsLabel } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/ui";

export default function DemoAdminPlans() {
  return (
    <>
      <PageHeader title="Planos" subtitle="Preços, quantidade de atendimentos e validade, todos editáveis pelo administrador." />
      <Card className="overflow-x-auto !p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-sand text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Plano</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Atendimentos</th>
              <th className="px-4 py-3 font-semibold">Validade</th>
              <th className="px-4 py-3 text-right font-semibold">Preço</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PLANS.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold">
                  {p.name} {p.highlighted && <Badge tone="primary">destaque</Badge>}
                </td>
                <td className="px-4 py-3">{p.kind === "subscription" ? "Assinatura mensal" : "Avulso"}</td>
                <td className="px-4 py-3">{sessionsLabel(p.sessions_included)}</td>
                <td className="px-4 py-3">{p.duration_days} dias</td>
                <td className="px-4 py-3 text-right font-bold">{money(p.price_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
