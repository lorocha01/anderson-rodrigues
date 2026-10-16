"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Card } from "@/components/ui";
import { CrisisPanel } from "@/components/crisis";
import { submitTriage } from "../actions";
import type { Category, TriageOption, TriageQuestion } from "@/lib/types";

type Step =
  | { kind: "risk" }
  | { kind: "crisis" }
  | { kind: "category" }
  | { kind: "question"; questionId: string }
  | { kind: "review" };

interface Answer {
  questionId: string;
  optionId: string;
}

const MAX_STEPS = 30; // proteção contra ciclos na árvore

export function TriageFlow({
  categories,
  questions,
  options,
}: {
  categories: Category[];
  questions: TriageQuestion[];
  options: TriageOption[];
}) {
  const riskQuestion = questions.find((q) => q.category_id === null);
  const optionsByQuestion = useMemo(() => {
    const map = new Map<string, TriageOption[]>();
    for (const o of options) map.set(o.question_id, [...(map.get(o.question_id) ?? []), o]);
    return map;
  }, [options]);
  const questionById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  const [history, setHistory] = useState<Step[]>([riskQuestion ? { kind: "risk" } : { kind: "category" }]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const step = history[history.length - 1];
  const category = categories.find((c) => c.id === categoryId);
  const maxRisk = Math.max(0, ...answers.map((a) => options.find((o) => o.id === a.optionId)?.risk_level ?? 0));

  function go(next: Step) {
    setHistory((h) => [...h, next]);
  }

  function back() {
    if (history.length <= 1) return;
    const previous = history[history.length - 2];
    // Remove a resposta da pergunta para a qual estamos voltando.
    const qid = previous.kind === "question" ? previous.questionId : previous.kind === "risk" ? riskQuestion?.id : undefined;
    if (qid) setAnswers((a) => a.filter((x) => x.questionId !== qid));
    if (previous.kind === "category") setCategoryId(null);
    setHistory((h) => h.slice(0, -1));
  }

  function answer(question: TriageQuestion, option: TriageOption) {
    setAnswers((a) => [...a.filter((x) => x.questionId !== question.id), { questionId: question.id, optionId: option.id }]);
    if (question.category_id === null) {
      go(option.risk_level === 2 ? { kind: "crisis" } : { kind: "category" });
      return;
    }
    const nextQuestion = option.next_question_id ? questionById.get(option.next_question_id) : undefined;
    if (nextQuestion && history.length < MAX_STEPS) go({ kind: "question", questionId: nextQuestion.id });
    else go({ kind: "review" });
  }

  function chooseCategory(c: Category) {
    setCategoryId(c.id);
    const root = questions.find((q) => q.category_id === c.id && q.is_root);
    go(root ? { kind: "question", questionId: root.id } : { kind: "review" });
  }

  function submit() {
    if (!categoryId) return;
    setError(null);
    startTransition(async () => {
      const result = await submitTriage(categoryId, answers.map((a) => a.optionId));
      if (result?.error) setError(result.error);
    });
  }

  const progress = step.kind === "review" ? 100 : Math.min(90, history.length * 18);

  return (
    <div>
      <div className="mb-6">
        <div className="h-2 overflow-hidden rounded-full bg-sand-deep">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step.kind === "risk" && riskQuestion && (
        <QuestionCard question={riskQuestion} options={optionsByQuestion.get(riskQuestion.id) ?? []} onAnswer={answer} />
      )}

      {step.kind === "crisis" && (
        <CrisisPanel>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => go({ kind: "category" })}>
              Já estou seguro(a), quero agendar uma conversa
            </Button>
          </div>
        </CrisisPanel>
      )}

      {step.kind === "category" && (
        <div>
          {maxRisk === 1 && (
            <p className="mb-6 rounded-2xl bg-peach-soft px-4 py-3 text-sm">
              Obrigado por compartilhar. Vamos priorizar o seu atendimento. Se em algum momento sentir que está em perigo,
              ligue <a href="tel:188" className="font-bold">188 (CVV)</a>.
            </p>
          )}
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Sobre o que você quer conversar?</h1>
          <p className="mt-1 text-muted">Escolha o tema que mais combina com o seu momento.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => chooseCategory(c)}
                className="flex gap-4 rounded-3xl border border-line bg-white p-5 text-left transition hover:border-primary hover:shadow-sm"
              >
                <span className="text-3xl" aria-hidden>{c.icon}</span>
                <span>
                  <span className="block font-bold">{c.name}</span>
                  <span className="text-sm text-muted">{c.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step.kind === "question" && questionById.get(step.questionId) && (
        <QuestionCard
          eyebrow={category ? `${category.icon} ${category.name}` : undefined}
          question={questionById.get(step.questionId)!}
          options={optionsByQuestion.get(step.questionId) ?? []}
          selected={answers.find((a) => a.questionId === step.questionId)?.optionId}
          onAnswer={answer}
        />
      )}

      {step.kind === "review" && (
        <Card>
          <h1 className="font-display text-2xl font-semibold">Tudo certo!</h1>
          <p className="mt-1 text-muted">
            Confira suas respostas. Elas ficam visíveis apenas para o psicólogo que vai te atender.
          </p>
          <dl className="mt-5 space-y-3">
            <div className="rounded-2xl bg-sand p-4">
              <dt className="text-sm text-muted">Tema</dt>
              <dd className="font-bold">{category?.icon} {category?.name}</dd>
            </div>
            {answers
              .filter((a) => questionById.get(a.questionId)?.category_id !== null)
              .map((a) => (
                <div key={a.questionId} className="rounded-2xl bg-sand p-4">
                  <dt className="text-sm text-muted">{questionById.get(a.questionId)?.text}</dt>
                  <dd className="font-bold">{options.find((o) => o.id === a.optionId)?.label}</dd>
                </div>
              ))}
          </dl>
          {error && <p className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
          <Button className="mt-6 w-full py-3 text-base" onClick={submit} disabled={pending}>
            {pending ? "Enviando…" : "Continuar para o agendamento"}
          </Button>
        </Card>
      )}

      {history.length > 1 && (
        <button onClick={back} className="mt-6 text-sm font-bold text-muted hover:text-ink" disabled={pending}>
          ← Voltar
        </button>
      )}
    </div>
  );
}

function QuestionCard({
  eyebrow,
  question,
  options,
  selected,
  onAnswer,
}: {
  eyebrow?: string;
  question: TriageQuestion;
  options: TriageOption[];
  selected?: string;
  onAnswer: (q: TriageQuestion, o: TriageOption) => void;
}) {
  return (
    <div>
      {eyebrow && <p className="mb-2 text-sm font-bold text-primary">{eyebrow}</p>}
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{question.text}</h1>
      {question.help_text && <p className="mt-2 text-muted">{question.help_text}</p>}
      <div className="mt-6 space-y-3">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onAnswer(question, o)}
            className={`block w-full rounded-2xl border bg-white px-5 py-4 text-left font-semibold transition hover:border-primary ${
              selected === o.id ? "border-primary ring-2 ring-primary/20" : "border-line"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
