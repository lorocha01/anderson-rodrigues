import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { availableSessions, currentMemberships } from "@/lib/client-data";
import { dateLong, dateShort, firstName, time } from "@/lib/format";
import { type FlashParams } from "@/lib/flash";
import { ButtonLink, Card, Flash } from "@/components/ui";
import type { Appointment, Category, Triage } from "@/lib/types";

export default async function ClientHome({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { profile, supabase } = await requireRole("client");

  const [memberships, { data: next }, { data: openTriages }, { data: categories }] = await Promise.all([
    currentMemberships(supabase),
    supabase
      .from("appointments")
      .select("*")
      .eq("status", "scheduled")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(1)
      .returns<Appointment[]>(),
    supabase.from("triages").select("*").eq("status", "open").order("created_at", { ascending: false }).returns<Triage[]>(),
    supabase.from("categories").select("id, name, icon").returns<Pick<Category, "id" | "name" | "icon">[]>(),
  ]);

  const available = availableSessions(memberships);
  const nextAppt = next?.[0];
  const catById = new Map((categories ?? []).map((c) => [c.id, c]));
  const { data: psy } = nextAppt
    ? await supabase.from("psychologists").select("display_name").eq("id", nextAppt.psychologist_id).maybeSingle<{ display_name: string }>()
    : { data: null };

  return (
    <>
      <Flash ok={ok} erro={erro} />
      <h1 className="font-display text-3xl font-semibold">Olá, {firstName(profile.full_name)} 🌿</h1>
      <p className="mt-1 text-muted">Este é o seu espaço. Como podemos te ajudar hoje?</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="!border-primary !bg-primary text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">Próximo atendimento</p>
          {nextAppt ? (
            <>
              <p className="mt-2 font-display text-2xl font-semibold">{dateLong(nextAppt.starts_at)}</p>
              <p className="text-lg">às {time(nextAppt.starts_at)} com {psy?.display_name ?? "seu psicólogo"}</p>
              {nextAppt.meet_url && (
                <a href={nextAppt.meet_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary">
                  Entrar na chamada
                </a>
              )}
            </>
          ) : (
            <>
              <p className="mt-2 text-lg">Nenhum atendimento agendado.</p>
              <Link href="/cliente/triagem" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary">
                Quero conversar
              </Link>
            </>
          )}
        </Card>

        <Card>
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Seu plano</p>
          {memberships.length > 0 ? (
            <>
              <p className="mt-2 font-display text-2xl font-semibold">
                {available === null ? "Atendimentos livres" : `${available} ${available === 1 ? "atendimento disponível" : "atendimentos disponíveis"}`}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {memberships.map((m) => (
                  <li key={m.id}>
                    {m.plan_name}: {m.sessions_total === null ? "livre" : `${m.sessions_used} de ${m.sessions_total} usado(s)`} · até{" "}
                    {m.ends_at && dateShort(m.ends_at)}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/cliente/planos" variant="secondary" className="mt-4">Renovar ou comprar avulso</ButtonLink>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg">Você ainda não tem um plano ativo.</p>
              <ButtonLink href="/cliente/planos" className="mt-4">Escolher plano</ButtonLink>
            </>
          )}
        </Card>
      </div>

      {openTriages && openTriages.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Conversas aguardando agendamento</h2>
          <div className="space-y-3">
            {openTriages.map((t) => {
              const c = catById.get(t.category_id);
              return (
                <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
                  <span className="font-semibold">
                    {c?.icon} {c?.name} <span className="font-normal text-muted">· triagem de {dateShort(t.created_at)}</span>
                  </span>
                  <ButtonLink href={`/cliente/agendar/${t.id}`} variant="secondary">Agendar</ButtonLink>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
