"use client";

import Link from "next/link";
import { DEMO_CATEGORIES, DEMO_PSYCHOLOGISTS } from "@/lib/demo/data";
import { dateLong, dateShort, time } from "@/lib/format";
import { ButtonLink, Card } from "@/components/ui";
import { useDemo } from "../store";

export default function DemoClientHome() {
  const { plan, remaining, used, upcoming, state } = useDemo();
  const next = upcoming[0];
  const psy = next && DEMO_PSYCHOLOGISTS.find((p) => p.id === next.psychologistId);
  const openTriages = state.triages.filter((t) => t.status === "open");

  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Olá! 🌿</h1>
      <p className="mt-1 text-muted">Este é o seu espaço. Como podemos te ajudar hoje?</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="!border-primary !bg-primary text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">Próximo atendimento</p>
          {next ? (
            <>
              <p className="mt-2 font-display text-2xl font-semibold">{dateLong(next.startsAt)}</p>
              <p className="text-lg">às {time(next.startsAt)} com {psy?.display_name}</p>
              <Link href="/demo/cliente/atendimentos" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary">
                Entrar na chamada
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg">Nenhum atendimento agendado.</p>
              <Link href="/demo/cliente/triagem" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary">
                Quero conversar
              </Link>
            </>
          )}
        </Card>

        <Card>
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Seu plano</p>
          {plan ? (
            <>
              <p className="mt-2 font-display text-2xl font-semibold">
                {remaining === null ? "Atendimentos livres" : `${remaining} ${remaining === 1 ? "atendimento disponível" : "atendimentos disponíveis"}`}
              </p>
              <p className="mt-3 text-sm text-muted">
                {plan.name}: {plan.sessions_included === null ? "livre" : `${used} de ${plan.sessions_included} usado(s)`}
                {state.membership && ` · até ${dateShort(new Date(new Date(state.membership.startedAt).getTime() + plan.duration_days * 864e5).toISOString())}`}
              </p>
              <ButtonLink href="/demo/cliente/planos" variant="secondary" className="mt-4">Renovar ou comprar avulso</ButtonLink>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg">Você ainda não tem um plano ativo.</p>
              <ButtonLink href="/demo/cliente/planos" className="mt-4">Escolher plano</ButtonLink>
            </>
          )}
        </Card>
      </div>

      {openTriages.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Conversas aguardando agendamento</h2>
          <div className="space-y-3">
            {openTriages.map((t) => {
              const c = DEMO_CATEGORIES.find((x) => x.id === t.categoryId);
              return (
                <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
                  <span className="font-semibold">
                    {c?.icon} {c?.name} <span className="font-normal text-muted">· triagem de {dateShort(t.createdAt)}</span>
                  </span>
                  <ButtonLink href={`/demo/cliente/agendar?triagem=${t.id}`} variant="secondary">Agendar</ButtonLink>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
