import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { dateShort, time } from "@/lib/format";
import { Card, EmptyState, Flash, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { cancelAsAdmin } from "../actions";
import type { Appointment, Category } from "@/lib/types";

export const metadata: Metadata = { title: "Atendimentos" };

const FILTERS = [
  { key: "proximos", label: "Próximos" },
  { key: "realizados", label: "Realizados" },
  { key: "faltas", label: "Faltas" },
  { key: "cancelados", label: "Cancelados" },
];

export default async function AdminAppointments({ searchParams }: { searchParams: Promise<{ f?: string; ok?: string; erro?: string }> }) {
  const { f = "proximos", ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");

  let query = supabase.from("appointments").select("*").limit(200);
  const nowIso = new Date().toISOString();
  if (f === "realizados") query = query.eq("status", "completed").order("starts_at", { ascending: false });
  else if (f === "faltas") query = query.eq("status", "no_show").order("starts_at", { ascending: false });
  else if (f === "cancelados") query = query.eq("status", "canceled").order("starts_at", { ascending: false });
  else query = query.eq("status", "scheduled").gte("ends_at", nowIso).order("starts_at");
  const { data: appointments } = await query.returns<Appointment[]>();

  const list = appointments ?? [];
  const [{ data: clients }, { data: psys }, { data: categories }] = await Promise.all([
    list.length ? supabase.from("profiles").select("id, full_name").in("id", [...new Set(list.map((a) => a.client_id))]) : { data: [] },
    list.length ? supabase.from("psychologists").select("id, display_name").in("id", [...new Set(list.map((a) => a.psychologist_id))]) : { data: [] },
    supabase.from("categories").select("id, name").returns<Pick<Category, "id" | "name">[]>(),
  ]);
  const clientName = new Map((clients ?? []).map((c) => [c.id as string, c.full_name as string]));
  const psyName = new Map((psys ?? []).map((p) => [p.id as string, p.display_name as string]));
  const catName = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="Atendimentos" />
      <Flash ok={ok} erro={erro} />
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/admin/atendimentos?f=${x.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${f === x.key ? "bg-ink text-white" : "bg-white text-muted border border-line"}`}
          >
            {x.label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Nada por aqui" />
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-sand text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Psicólogo(a)</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{dateShort(a.starts_at)} {time(a.starts_at)}</td>
                  <td className="px-4 py-3">{clientName.get(a.client_id) ?? "—"}</td>
                  <td className="px-4 py-3">{psyName.get(a.psychologist_id) ?? "—"}</td>
                  <td className="px-4 py-3">{catName.get(a.category_id)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "scheduled" && new Date(a.starts_at) > new Date() && (
                      <form action={cancelAsAdmin}>
                        <input type="hidden" name="appointment_id" value={a.id} />
                        <SubmitButton variant="ghost" className="!px-3 !py-1" confirm="Cancelar e devolver o crédito ao cliente?">
                          Cancelar
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
