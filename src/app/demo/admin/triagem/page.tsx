"use client";

import { useState } from "react";
import { DEMO_CATEGORIES, DEMO_OPTIONS, DEMO_QUESTIONS } from "@/lib/demo/data";
import { Badge, Card, PageHeader } from "@/components/ui";

const RISK = ["", "Atenção (gera alerta)", "Risco imediato (mostra CVV/SAMU)"];

export default function DemoTriageTree() {
  const [tab, setTab] = useState<string>("risco");
  const questions = DEMO_QUESTIONS.filter((q) => (tab === "risco" ? q.category_id === null : q.category_id === tab));
  const textOf = (id: string | null) => DEMO_QUESTIONS.find((q) => q.id === id)?.text;

  return (
    <>
      <PageHeader
        title="Perguntas da triagem"
        subtitle="Fluxo do cliente: pergunta de segurança → escolha do tema → perguntas do tema → agendamento. Tudo editável aqui, sem programador."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {[{ id: "risco", label: "🛟 Segurança" }, ...DEMO_CATEGORIES.map((c) => ({ id: c.id, label: `${c.icon} ${c.name}` }))].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === t.id ? "bg-ink text-white" : "border border-line bg-white text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className={q.is_root ? "ring-2 ring-primary" : ""}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-muted">Pergunta {i + 1}</span>
              {q.is_root && <Badge tone="primary">Pergunta inicial</Badge>}
            </div>
            <p className="font-display text-lg font-semibold">{q.text}</p>
            <ul className="mt-3 space-y-2">
              {DEMO_OPTIONS.filter((o) => o.question_id === q.id).map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-sand px-4 py-2.5 text-sm">
                  <span className="font-semibold">{o.label}</span>
                  {tab !== "risco" && (
                    <span className="text-muted">→ {o.next_question_id ? textOf(o.next_question_id) : "fim, vai para o agendamento"}</span>
                  )}
                  {o.risk_level > 0 && <Badge tone={o.risk_level === 2 ? "danger" : "peach"}>{RISK[o.risk_level]}</Badge>}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Na versão real, cada pergunta e resposta é editável: o administrador cria perguntas, define para onde cada resposta
        leva e marca quais respostas indicam risco.
      </p>
    </>
  );
}
