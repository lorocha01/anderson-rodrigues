"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DEMO_CATEGORIES, DEMO_PSYCHOLOGISTS, DEMO_SETTINGS } from "@/lib/demo/data";
import { dateLong, dateShort, time } from "@/lib/format";
import { Button, ButtonLink, Card, EmptyState, Flash, PageHeader, StatusBadge } from "@/components/ui";
import { useDemo } from "../../store";

export default function DemoAppointmentsPage() {
  return (
    <Suspense>
      <DemoAppointments />
    </Suspense>
  );
}

function DemoAppointments() {
  const params = useSearchParams();
  const { state, upcoming, cancel } = useDemo();
  const [msg, setMsg] = useState<string | null>(params.get("agendado") ? "Atendimento agendado! O link da chamada já está disponível abaixo." : null);
  const past = state.appointments.filter((a) => !upcoming.includes(a)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const windowHours = DEMO_SETTINGS.cancel_window_hours;
  const psyName = (id: string) => DEMO_PSYCHOLOGISTS.find((p) => p.id === id)?.display_name ?? "psicólogo(a)";

  return (
    <>
      <PageHeader title="Meus atendimentos" action={<ButtonLink href="/demo/cliente/triagem">Novo atendimento</ButtonLink>} />
      <Flash ok={msg ?? undefined} />

      <h2 className="mb-3 text-lg font-bold">Próximos</h2>
      {upcoming.length === 0 ? (
        <EmptyState title="Nenhum atendimento agendado" />
      ) : (
        <div className="space-y-4">
          {upcoming.map((a) => {
            const c = DEMO_CATEGORIES.find((x) => x.id === a.categoryId);
            const late = new Date(a.startsAt).getTime() - Date.now() < windowHours * 3600_000;
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold">{dateLong(a.startsAt)}</p>
                    <p className="text-lg">{time(a.startsAt)} às {time(a.endsAt)}</p>
                    <p className="mt-1 text-sm text-muted">{c?.icon} {c?.name} · com {psyName(a.psychologistId)}</p>
                  </div>
                  <StatusBadge status="scheduled" />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button onClick={() => window.alert("Na versão real, este botão abre a sala fixa do Google Meet do psicólogo.")}>
                    Entrar na chamada (Google Meet)
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const question = late
                        ? `Faltam menos de ${windowHours}h. Se cancelar agora, o crédito NÃO volta para o seu plano. Deseja cancelar?`
                        : "Deseja cancelar este atendimento? O crédito volta para o seu plano.";
                      if (!window.confirm(question)) return;
                      const refunded = cancel(a.id);
                      setMsg(refunded
                        ? "Atendimento cancelado e o crédito voltou para o seu plano."
                        : "Atendimento cancelado. Como foi fora do prazo, o crédito foi consumido.");
                    }}
                  >
                    Cancelar
                  </Button>
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
            {past.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span>
                  <span className="font-semibold">{dateShort(a.startsAt)} {time(a.startsAt)}</span>
                  <span className="text-muted"> · {DEMO_CATEGORIES.find((c) => c.id === a.categoryId)?.name} · {psyName(a.psychologistId)}</span>
                </span>
                <span className="flex items-center gap-2">
                  {a.status === "canceled" && (
                    <span className="text-xs text-muted">{a.creditRefunded ? "crédito devolvido" : "crédito consumido"}</span>
                  )}
                  <StatusBadge status={a.status === "canceled" ? "canceled" : "completed"} />
                </span>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
}
