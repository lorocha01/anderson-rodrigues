import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { dateShort } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import type { MembershipBalance, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Clientes" };

export default async function AdminClients() {
  const { supabase } = await requireRole("admin");
  const [{ data: clients }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false }).limit(300).returns<Profile[]>(),
    supabase.from("membership_balances").select("*").eq("is_current", true).returns<MembershipBalance[]>(),
  ]);
  const current = new Map<string, MembershipBalance[]>();
  for (const m of memberships ?? []) current.set(m.client_id, [...(current.get(m.client_id) ?? []), m]);

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${clients?.length ?? 0} cadastrados · ${current.size} com plano ativo`} />
      {(clients ?? []).length === 0 ? (
        <EmptyState title="Nenhum cliente ainda" />
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-sand text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Telefone</th>
                <th className="px-4 py-3 font-semibold">Plano vigente</th>
                <th className="px-4 py-3 font-semibold">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {(clients ?? []).map((c) => {
                const ms = current.get(c.id) ?? [];
                return (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-4 py-3 font-semibold">{c.full_name || "—"}</td>
                    <td className="px-4 py-3">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {ms.length === 0 ? (
                        <Badge>Sem plano</Badge>
                      ) : (
                        ms.map((m) => (
                          <span key={m.id} className="block">
                            {m.plan_name} · {m.sessions_total === null ? "livre" : `${m.sessions_used}/${m.sessions_total}`} · até {m.ends_at && dateShort(m.ends_at)}
                          </span>
                        ))
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{dateShort(c.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
