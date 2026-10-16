import { requireRole } from "@/lib/auth";
import { dateLong, dateShort, time } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { Card, EmptyState, Flash, PageHeader, RiskBadge, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { cancelByPsychologist, setOutcome } from "./actions";
import type { Appointment, Category, Profile, Triage } from "@/lib/types";

export default async function PsychologistAgenda({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { profile, supabase } = await requireRole("psychologist");

  const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("psychologist_id", profile.id)
    .gte("starts_at", since)
    .order("starts_at")
    .returns<Appointment[]>();

  const list = appointments ?? [];
  const clientIds = [...new Set(list.map((a) => a.client_id))];
  const triageIds = list.map((a) => a.triage_id).filter((id): id is string => !!id);
  const [{ data: clients }, { data: triages }, { data: categories }, { data: me }] = await Promise.all([
    clientIds.length ? supabase.from("profiles").select("id, full_name, phone").in("id", clientIds).returns<Pick<Profile, "id" | "full_name" | "phone">[]>() : { data: [] },
    triageIds.length ? supabase.from("triages").select("*").in("id", triageIds).returns<Triage[]>() : { data: [] },
    supabase.from("categories").select("id, name, icon").returns<Pick<Category, "id" | "name" | "icon">[]>(),
    supabase.from("availability_rules").select("id").eq("psychologist_id", profile.id).limit(1),
  ]);

  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  const triageById = new Map((triages ?? []).map((t) => [t.id, t]));
  const catById = new Map((categories ?? []).map((c) => [c.id, c]));
  const now = Date.now();

  const pendingOutcome = list.filter((a) => a.status === "scheduled" && new Date(a.starts_at).getTime() <= now);
  const upcoming = list.filter((a) => a.status === "scheduled" && new Date(a.starts_at).getTime() > now);
  const history = list.filter((a) => a.status !== "scheduled").reverse();

  const renderCard = (a: Appointment, mode: "upcoming" | "outcome") => {
    const client = clientById.get(a.client_id);
    const triage = a.triage_id ? triageById.get(a.triage_id) : undefined;
    const c = catById.get(a.category_id);
    return (
      <Card key={a.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold">
              {dateLong(a.starts_at)} · {time(a.starts_at)}
            </p>
            <p className="font-bold">{client?.full_name ?? "Cliente"}</p>
            <p className="text-sm text-muted">
              {c?.icon} {c?.name}
              {client?.phone && <> · {client.phone}</>}
            </p>
          </div>
          {triage && <RiskBadge level={triage.risk_level} />}
        </div>

        {triage && triage.answers.length > 0 && (
          <details className="mt-4 rounded-2xl bg-sand p-4 text-sm">
            <summary className="cursor-pointer font-bold">Respostas da triagem</summary>
            <dl className="mt-3 space-y-2">
              {triage.answers.map((ans, i) => (
                <div key={i}>
                  <dt className="text-muted">{ans.question}</dt>
                  <dd className={`font-semibold ${ans.risk_level > 0 ? "text-danger" : ""}`}>{ans.answer}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {mode === "upcoming" ? (
            <>
              {a.meet_url && (
                <a href={a.meet_url} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
                  Abrir sala
                </a>
              )}
              <form action={cancelByPsychologist}>
                <input type="hidden" name="appointment_id" value={a.id} />
                <SubmitButton variant="ghost" confirm="Cancelar este atendimento? O cliente recebe o crédito de volta.">
                  Cancelar
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <form action={setOutcome}>
                <input type="hidden" name="appointment_id" value={a.id} />
                <input type="hidden" name="status" value="completed" />
                <SubmitButton>Atendimento realizado</SubmitButton>
              </form>
              <form action={setOutcome}>
                <input type="hidden" name="appointment_id" value={a.id} />
                <input type="hidden" name="status" value="no_show" />
                <SubmitButton variant="secondary" confirm="Registrar que o cliente faltou? O crédito é consumido.">
                  Cliente faltou
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <PageHeader title="Agenda" subtitle="Seus atendimentos e o resumo da triagem de cada cliente." />
      <Flash ok={ok} erro={erro} />

      {(me ?? []).length === 0 && (
        <p className="mb-6 rounded-2xl bg-peach-soft px-4 py-3 text-sm font-semibold text-peach">
          Você ainda não cadastrou sua disponibilidade. Sem ela, os clientes não conseguem agendar com você.
        </p>
      )}

      {pendingOutcome.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Registrar resultado</h2>
          <div className="space-y-4">{pendingOutcome.map((a) => renderCard(a, "outcome"))}</div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold">Próximos atendimentos</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="Nenhum atendimento agendado" />
        ) : (
          <div className="space-y-4">{upcoming.map((a) => renderCard(a, "upcoming"))}</div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Últimos 30 dias</h2>
          <Card className="divide-y divide-line !p-0">
            {history.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span>
                  <span className="font-semibold">{dateShort(a.starts_at)} {time(a.starts_at)}</span>
                  <span className="text-muted"> · {clientById.get(a.client_id)?.full_name ?? "Cliente"}</span>
                </span>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </Card>
        </section>
      )}
    </>
  );
}
