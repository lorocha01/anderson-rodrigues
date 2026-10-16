"use client";

import { DEMO_LOGGED_PSYCHOLOGIST, DEMO_PSYCHOLOGISTS, DEMO_SETTINGS } from "@/lib/demo/data";
import { WEEKDAYS } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";

export default function DemoAvailability() {
  const psy = DEMO_PSYCHOLOGISTS.find((p) => p.id === DEMO_LOGGED_PSYCHOLOGIST)!;
  return (
    <>
      <PageHeader
        title="Disponibilidade"
        subtitle={`Horários semanais em que você atende (horário de Brasília). Cada atendimento dura ${DEMO_SETTINGS.session_minutes} minutos.`}
      />
      <Card className="!p-0">
        {WEEKDAYS.map((label, day) => {
          const rules = psy.rules.filter(([d]) => d === day);
          return (
            <div key={day} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 last:border-0">
              <span className="w-24 font-bold">{label}</span>
              {rules.length === 0 ? (
                <span className="text-sm text-muted">Sem atendimento</span>
              ) : (
                rules.map(([, start, end]) => (
                  <span key={start} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-dark">
                    {start}–{end}
                  </span>
                ))
              )}
            </div>
          );
        })}
      </Card>
      <p className="mt-3 text-sm text-muted">
        Na versão real, a psicóloga adiciona e remove faixas de horário aqui, e o sistema gera os horários livres automaticamente.
      </p>
    </>
  );
}
