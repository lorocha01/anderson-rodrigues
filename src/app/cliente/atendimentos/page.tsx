import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { dateLong, dateShort, time } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { ButtonLink, Card, EmptyState, Flash, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { cancelAppointment } from "../actions";
import type { Appointment, Category, Settings } from "@/lib/types";

export const metadata: Metadata = { title: "Meus atendimentos" };

export default async function AppointmentsPage({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("client");

  const [{ data: appointments }, { data: categories }, { data: settings }] = await Promise.all([
    supabase.from("appointments").select("*").order("starts_at", { ascending: false }).returns<Appointment[]>(),
    supabase.from("categories").select("id, name, icon").returns<Pick<Category, "id" | "name" | "icon">[]>(),
    supabase.from("settings").select("*").single<Settings>(),
  ]);
  const psyIds = [...new Set((appointments ?? []).map((a) => a.psychologist_id))];
  const { data: psys } = psyIds.length
    ? await supabase.from("psychologists").select("id, display_name").in("id", psyIds)
    : { data: [] };

  const psyName = new Map((psys ?? []).map((p) => [p.id as string, p.display_name as string]));
  const catById = new Map((categories ?? []).map((c) => [c.id, c]));
  const now = Date.now();
  const upcoming = (appointments ?? []).filter((a) => a.status === "scheduled" && new Date(a.ends_at).getTime() >= now).reverse();
  const past = (appointments ?? []).filter((a) => !upcoming.includes(a));
  const windowHours = settings?.cancel_window_hours ?? 24;

  return (
    <>
      <PageHeader
        title="Meus atendimentos"
        action={<ButtonLink href="/cliente/triagem">Novo atendimento</ButtonLink>}
      />
      <Flash ok={ok} erro={erro} />

      <h2 className="mb-3 text-lg font-bold">Próximos</h2>
      {upcoming.length === 0 ? (
        <EmptyState title="Nenhum atendimento agendado" />
      ) : (
        <div className="space-y-4">
          {upcoming.map((a) => {
            const c = catById.get(a.category_id);
            const lateCancel = new Date(a.starts_at).getTime() - now < windowHours * 3600_000;
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold">{dateLong(a.starts_at)}</p>
                    <p className="text-lg">
                      {time(a.starts_at)} às {time(a.ends_at)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {c?.icon} {c?.name} · com {psyName.get(a.psychologist_id) ?? "psicólogo(a)"}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {a.meet_url ? (
                    <a href={a.meet_url} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
                      Entrar na chamada (Google Meet)
                    </a>
                  ) : (
                    <span className="text-sm text-muted">O link da chamada será enviado pelo psicólogo.</span>
                  )}
                  <form action={cancelAppointment}>
                    <input type="hidden" name="appointment_id" value={a.id} />
                    <SubmitButton
                      variant="ghost"
                      pendingText="Cancelando…"
                      confirm={
                        lateCancel
                          ? `Faltam menos de ${windowHours}h. Se cancelar agora, o crédito NÃO volta para o seu plano. Deseja cancelar?`
                          : "Deseja cancelar este atendimento? O crédito volta para o seu plano."
                      }
                    >
                      Cancelar
                    </SubmitButton>
                  </form>
                </div>
                <p className="mt-3 text-xs text-muted">
                  Cancelamentos com pelo menos {windowHours}h de antecedência devolvem o crédito ao plano.
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-lg font-bold">Histórico</h2>
          <Card className="divide-y divide-line !p-0">
            {past.map((a) => {
              const c = catById.get(a.category_id);
              return (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span>
                    <span className="font-semibold">{dateShort(a.starts_at)} {time(a.starts_at)}</span>
                    <span className="text-muted"> · {c?.name} · {psyName.get(a.psychologist_id) ?? "psicólogo(a)"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {a.status === "canceled" && (
                      <span className="text-xs text-muted">{a.credit_refunded ? "crédito devolvido" : "crédito consumido"}</span>
                    )}
                    <StatusBadge status={a.status} />
                  </span>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </>
  );
}
