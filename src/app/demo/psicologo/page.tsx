"use client";

import { useState } from "react";
import { DEMO_CATEGORIES, DEMO_LOGGED_PSYCHOLOGIST } from "@/lib/demo/data";
import { dateLong, dateShort, time } from "@/lib/format";
import { Badge, Button, Card, EmptyState, Flash, PageHeader, RiskBadge, StatusBadge } from "@/components/ui";
import { useDemo } from "../store";
import { demoRows, type DemoRow } from "../rows";

export default function DemoPsychologistAgenda() {
  const { state, cancel } = useDemo();
  const [msg, setMsg] = useState<string | null>(null);
  const rows = demoRows(state).filter((r) => r.psychologistId === DEMO_LOGGED_PSYCHOLOGIST);
  const now = Date.now();
  const upcoming = rows.filter((r) => r.status === "scheduled" && new Date(r.startsAt).getTime() > now);
  const history = rows.filter((r) => !upcoming.includes(r)).reverse();

  const card = (r: DemoRow) => {
    const c = DEMO_CATEGORIES.find((x) => x.id === r.categoryId);
    return (
      <Card key={r.id} className={r.mine ? "ring-2 ring-lilac" : ""}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold">{dateLong(r.startsAt)} · {time(r.startsAt)}</p>
            <p className="font-bold">{r.clientName}</p>
            <p className="text-sm text-muted">{c?.icon} {c?.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {r.mine && <Badge tone="lilac">Agendado por você na demo</Badge>}
            <RiskBadge level={r.riskLevel} />
          </div>
        </div>
        {r.answers.length > 0 && (
          <details className="mt-4 rounded-2xl bg-sand p-4 text-sm" open={r.mine}>
            <summary className="cursor-pointer font-bold">Respostas da triagem</summary>
            <dl className="mt-3 space-y-2">
              {r.answers.map((a, i) => (
                <div key={i}>
                  <dt className="text-muted">{a.question}</dt>
                  <dd className={`font-semibold ${a.risk_level > 0 ? "text-danger" : ""}`}>{a.answer}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => window.alert("Na versão real, abre a sala fixa do Google Meet da psicóloga.")}>Abrir sala</Button>
          {r.mine && (
            <Button
              variant="ghost"
              onClick={() => {
                if (!window.confirm("Cancelar este atendimento? O cliente recebe o crédito de volta.")) return;
                cancel(r.id);
                setMsg("Atendimento cancelado.");
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <PageHeader title="Agenda" subtitle="Seus atendimentos e o resumo da triagem de cada cliente." />
      <Flash ok={msg ?? undefined} />
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold">Próximos atendimentos</h2>
        {upcoming.length === 0 ? <EmptyState title="Nenhum atendimento agendado" /> : <div className="space-y-4">{upcoming.map(card)}</div>}
      </section>
      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Últimos dias</h2>
          <Card className="divide-y divide-line !p-0">
            {history.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span>
                  <span className="font-semibold">{dateShort(r.startsAt)} {time(r.startsAt)}</span>
                  <span className="text-muted"> · {r.clientName}</span>
                </span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </Card>
          <p className="mt-3 text-xs text-muted">
            Depois do horário, a psicóloga registra se o atendimento foi realizado ou se o cliente faltou.
          </p>
        </section>
      )}
    </>
  );
}
