"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_CATEGORIES, DEMO_PSYCHOLOGISTS } from "@/lib/demo/data";
import { dateLong, dayChip, dayKey, time } from "@/lib/format";
import { Button, Card, EmptyState, Flash, PageHeader } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { SlotPicker, type PickerDay } from "@/app/cliente/agendar/[triageId]/slot-picker";
import { availableSlots, useDemo } from "../../store";

export default function DemoSchedulePage() {
  return (
    <Suspense>
      <DemoSchedule />
    </Suspense>
  );
}

function DemoSchedule() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, book } = useDemo();
  const [error, setError] = useState<string | null>(null);

  const triageId = params.get("triagem") ?? "";
  const psi = params.get("psi");
  const triage = state.triages.find((t) => t.id === triageId && t.status === "open");

  if (!triage) {
    return (
      <EmptyState title="Nenhuma triagem aguardando agendamento">
        <Link href="/demo/cliente/triagem" className="font-bold text-primary">Fazer a triagem</Link>
      </EmptyState>
    );
  }

  const category = DEMO_CATEGORIES.find((c) => c.id === triage.categoryId);
  const psychologists = DEMO_PSYCHOLOGISTS.filter((p) => p.categories.includes(triage.categoryId));
  const chosen = psi ? psychologists.find((p) => p.id === psi) : undefined;
  const choosing = params.get("modo") === "profissional" && !chosen;
  const base = `/demo/cliente/agendar?triagem=${triage.id}`;

  const slots = choosing ? [] : availableSlots(triage.categoryId, chosen?.id ?? null, state.appointments);
  const times = [...new Set(slots.map((s) => s.startsAt))];
  const byDay = new Map<string, string[]>();
  for (const t of times) byDay.set(dayKey(t), [...(byDay.get(dayKey(t)) ?? []), t]);
  const days: PickerDay[] = [...byDay.entries()].map(([key, list]) => ({
    key,
    ...dayChip(list[0]),
    long: dateLong(list[0]),
    times: list.map((iso) => ({ iso, label: time(iso) })),
  }));

  return (
    <>
      <PageHeader title="Escolha o melhor horário" subtitle={<>{category?.icon} {category?.name} · atendimento online por vídeo</>} />
      <Flash erro={error ?? undefined} />

      {triage.riskLevel > 0 && (
        <p className="mb-6 rounded-2xl bg-peach-soft px-4 py-3 text-sm">
          Sua conversa foi marcada como prioritária. Se precisar de ajuda antes do horário, ligue{" "}
          <a href="tel:188" className="font-bold">188 (CVV)</a>.
        </p>
      )}

      <div className="mb-6 inline-flex rounded-full border border-line bg-white p-1 text-sm font-bold">
        <Link href={base} className={`rounded-full px-4 py-2 ${!psi && !choosing ? "bg-primary text-white" : "text-muted"}`}>
          Primeiro horário livre
        </Link>
        <Link href={`${base}&modo=profissional`} className={`rounded-full px-4 py-2 ${psi || choosing ? "bg-primary text-white" : "text-muted"}`}>
          Escolher profissional
        </Link>
      </div>

      {choosing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {psychologists.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-center gap-4">
                <Avatar name={p.display_name} url={null} />
                <div>
                  <p className="font-bold">{p.display_name}</p>
                  <p className="text-sm text-muted">CRP {p.crp}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-primary-dark">{p.approach}</p>
              <p className="mt-1 text-sm text-muted">{p.bio}</p>
              <Link href={`${base}&psi=${p.id}`} className="mt-4 font-bold text-primary">Ver horários →</Link>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {chosen && (
            <Card className="mb-6 flex items-center gap-4 !p-4">
              <Avatar name={chosen.display_name} url={null} />
              <div className="flex-1">
                <p className="font-bold">{chosen.display_name}</p>
                <p className="text-sm text-muted">{chosen.approach}</p>
              </div>
              <Link href={`${base}&modo=profissional`} className="text-sm font-bold text-primary">Trocar</Link>
            </Card>
          )}

          {days.length === 0 ? (
            <EmptyState title="Nenhum horário livre no momento">Tente outro profissional.</EmptyState>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const startsAt = String(new FormData(e.currentTarget).get("starts_at") ?? "");
                const err = book(triage.id, startsAt, chosen?.id ?? null);
                if (err) setError(err);
                else router.push("/demo/cliente/atendimentos?agendado=1");
              }}
            >
              <SlotPicker days={days} />
              <div className="sticky bottom-0 -mx-4 mt-6 border-t border-line bg-sand/95 px-4 py-4 backdrop-blur">
                <Button type="submit" className="w-full py-3 text-base sm:w-auto">Confirmar agendamento</Button>
                <p className="mt-2 text-xs text-muted">
                  {chosen ? "" : "O sistema escolhe um psicólogo disponível do tema. "}O atendimento usa 1 crédito do seu plano.
                </p>
              </div>
            </form>
          )}
        </>
      )}
    </>
  );
}
