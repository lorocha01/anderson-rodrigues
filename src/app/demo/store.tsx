"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_OPTIONS, DEMO_PLANS, DEMO_PSYCHOLOGISTS, DEMO_SETTINGS } from "@/lib/demo/data";
import { dayKey } from "@/lib/format";

// Estado da demonstração, salvo só no navegador de quem está apresentando.

export interface DemoTriage {
  id: string;
  categoryId: string;
  optionIds: string[];
  riskLevel: number;
  createdAt: string;
  status: "open" | "scheduled";
}

export interface DemoAppointment {
  id: string;
  triageId: string;
  categoryId: string;
  psychologistId: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "canceled";
  creditRefunded: boolean;
  createdAt: string;
}

interface DemoState {
  membership: { planId: string; startedAt: string } | null;
  triages: DemoTriage[];
  appointments: DemoAppointment[];
}

const EMPTY: DemoState = { membership: null, triages: [], appointments: [] };
const KEY = "aconselha-demo-v1";
const MINUTE = 60_000;

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function useDemoState() {
  const [state, setState] = useState<DemoState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  const update = useCallback((fn: (s: DemoState) => DemoState) => {
    setState((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Sem armazenamento (aba anônima): a demo funciona só nesta sessão.
      }
      return next;
    });
  }, []);

  return { state, ready, update };
}

type Ctx = ReturnType<typeof buildApi>;
const DemoContext = createContext<Ctx | null>(null);

function buildApi(state: DemoState, ready: boolean, update: (fn: (s: DemoState) => DemoState) => void) {
  const plan = state.membership ? DEMO_PLANS.find((p) => p.id === state.membership!.planId) ?? null : null;
  const used = state.membership
    ? state.appointments.filter((a) => a.createdAt >= state.membership!.startedAt && (a.status === "scheduled" || !a.creditRefunded)).length
    : 0;
  const remaining = plan ? (plan.sessions_included === null ? null : Math.max(0, plan.sessions_included - used)) : 0;
  const upcoming = state.appointments
    .filter((a) => a.status === "scheduled" && new Date(a.endsAt).getTime() > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return {
    ready,
    state,
    plan,
    used,
    /** null = livre */
    remaining,
    upcoming,
    canBook: !!plan && (remaining === null || remaining > 0) && upcoming.length === 0,

    buyPlan(planId: string) {
      update((s) => ({ ...s, membership: { planId, startedAt: new Date().toISOString() } }));
    },

    submitTriage(categoryId: string, optionIds: string[]) {
      const riskLevel = Math.max(0, ...optionIds.map((id) => DEMO_OPTIONS.find((o) => o.id === id)?.risk_level ?? 0));
      const triage: DemoTriage = {
        id: `t-${Date.now()}`, categoryId, optionIds, riskLevel, createdAt: new Date().toISOString(), status: "open",
      };
      update((s) => ({ ...s, triages: [triage, ...s.triages] }));
      return triage.id;
    },

    book(triageId: string, startsAt: string, psychologistId: string | null) {
      const triage = state.triages.find((t) => t.id === triageId);
      if (!triage) return "Triagem não encontrada.";
      const free = availableSlots(triage.categoryId, psychologistId, state.appointments).filter((s) => s.startsAt === startsAt);
      if (free.length === 0) return "Este horário não está mais disponível. Escolha outro.";
      const appt: DemoAppointment = {
        id: `a-${Date.now()}`, triageId, categoryId: triage.categoryId, psychologistId: free[0].psychologistId,
        startsAt, endsAt: new Date(new Date(startsAt).getTime() + DEMO_SETTINGS.session_minutes * MINUTE).toISOString(),
        status: "scheduled", creditRefunded: false, createdAt: new Date().toISOString(),
      };
      update((s) => ({
        ...s,
        appointments: [...s.appointments, appt],
        triages: s.triages.map((t) => (t.id === triageId ? { ...t, status: "scheduled" } : t)),
      }));
      return null;
    },

    cancel(appointmentId: string) {
      const appt = state.appointments.find((a) => a.id === appointmentId);
      if (!appt) return false;
      const refund = new Date(appt.startsAt).getTime() - Date.now() >= DEMO_SETTINGS.cancel_window_hours * 60 * MINUTE;
      update((s) => ({
        ...s,
        appointments: s.appointments.map((a) => (a.id === appointmentId ? { ...a, status: "canceled", creditRefunded: refund } : a)),
        triages: s.triages.map((t) => (t.id === appt.triageId ? { ...t, status: "open" } : t)),
      }));
      return refund;
    },

    reset() {
      update(() => EMPTY);
    },
  };
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { state, ready, update } = useDemoState();
  const api = useMemo(() => buildApi(state, ready, update), [state, ready, update]);
  return <DemoContext.Provider value={api}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo fora do DemoProvider");
  return ctx;
}

// Horários ------------------------------------------------------------------

/** Data (yyyy-mm-dd) + hora (HH:MM) em Brasília → ISO. */
export function spIso(day: string, hhmm: string) {
  return new Date(`${day}T${hhmm}:00-03:00`).toISOString();
}

/** Dia (yyyy-mm-dd, Brasília) deslocado em N dias a partir de hoje. */
export function spDay(offset: number) {
  const today = dayKey(new Date().toISOString());
  const d = new Date(`${today}T12:00:00-03:00`);
  d.setUTCDate(d.getUTCDate() + offset);
  return dayKey(d.toISOString());
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hhmm(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Mesma regra de available_slots() do banco, calculada no navegador. */
export function availableSlots(categoryId: string, psychologistId: string | null, booked: DemoAppointment[]) {
  const dur = DEMO_SETTINGS.session_minutes;
  const earliest = Date.now() + DEMO_SETTINGS.min_notice_hours * 60 * MINUTE;
  const slots: { psychologistId: string; startsAt: string }[] = [];

  for (const psy of DEMO_PSYCHOLOGISTS) {
    if (!psy.categories.includes(categoryId)) continue;
    if (psychologistId && psy.id !== psychologistId) continue;
    for (let offset = 0; offset < DEMO_SETTINGS.booking_horizon_days; offset++) {
      const day = spDay(offset);
      const weekday = new Date(`${day}T12:00:00-03:00`).getUTCDay();
      for (const [wd, start, end] of psy.rules) {
        if (wd !== weekday) continue;
        for (let t = toMinutes(start); t + dur <= toMinutes(end); t += dur) {
          const startsAt = spIso(day, hhmm(t));
          const ms = new Date(startsAt).getTime();
          if (ms < earliest) continue;
          const taken = booked.some(
            (a) => a.status === "scheduled" && a.psychologistId === psy.id &&
              new Date(a.startsAt).getTime() < ms + dur * MINUTE && new Date(a.endsAt).getTime() > ms,
          );
          if (!taken) slots.push({ psychologistId: psy.id, startsAt });
        }
      }
    }
  }
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
