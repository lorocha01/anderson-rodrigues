import { DEMO_OPTIONS, DEMO_QUESTIONS, DEMO_SAMPLE_APPOINTMENTS, DEMO_SETTINGS } from "@/lib/demo/data";
import type { TriageAnswer } from "@/lib/types";
import { spDay, spIso, type DemoAppointment, type DemoTriage } from "./store";

export interface DemoRow {
  id: string;
  clientName: string;
  psychologistId: string;
  categoryId: string;
  startsAt: string;
  status: "scheduled" | "completed" | "no_show" | "canceled";
  riskLevel: number;
  answers: TriageAnswer[];
  /** Agendado por quem está apresentando a demo. */
  mine: boolean;
}

export const DEMO_CLIENT_NAME = "Cliente da demonstração";

function answersOf(triage: DemoTriage | undefined): TriageAnswer[] {
  if (!triage) return [];
  return triage.optionIds.map((id) => {
    const option = DEMO_OPTIONS.find((o) => o.id === id);
    const question = DEMO_QUESTIONS.find((q) => q.id === option?.question_id);
    return { question: question?.text ?? "", answer: option?.label ?? "", risk_level: option?.risk_level ?? 0 };
  });
}

/** Atendimentos fictícios + os agendados na demo, do mais antigo ao mais novo. */
export function demoRows(state: { appointments: DemoAppointment[]; triages: DemoTriage[] }): DemoRow[] {
  const samples: DemoRow[] = DEMO_SAMPLE_APPOINTMENTS.map((s) => ({
    id: s.id,
    clientName: s.clientName,
    psychologistId: s.psychologistId,
    categoryId: s.categoryId,
    startsAt: spIso(spDay(s.dayOffset), s.time),
    status: s.status,
    riskLevel: s.riskLevel,
    answers: s.answers,
    mine: false,
  }));
  const mine: DemoRow[] = state.appointments.map((a) => {
    const triage = state.triages.find((t) => t.id === a.triageId);
    return {
      id: a.id,
      clientName: DEMO_CLIENT_NAME,
      psychologistId: a.psychologistId,
      categoryId: a.categoryId,
      startsAt: a.startsAt,
      status: a.status,
      riskLevel: triage?.riskLevel ?? 0,
      answers: answersOf(triage),
      mine: true,
    };
  });
  return [...samples, ...mine].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function endsAt(startsAt: string) {
  return new Date(new Date(startsAt).getTime() + DEMO_SETTINGS.session_minutes * 60_000).toISOString();
}

export { answersOf };
