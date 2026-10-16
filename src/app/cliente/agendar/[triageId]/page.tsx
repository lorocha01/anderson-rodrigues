import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { dateLong, dayChip, dayKey, time } from "@/lib/format";
import { Card, EmptyState, Flash, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { Avatar } from "@/components/avatar";
import { SlotPicker, type PickerDay } from "./slot-picker";
import { bookAppointment } from "../../actions";
import type { Category, Psychologist, Slot, Triage } from "@/lib/types";

export const metadata: Metadata = { title: "Agendar" };

type PublicPsychologist = Pick<Psychologist, "id" | "display_name" | "crp" | "bio" | "approach" | "photo_url">;

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ triageId: string }>;
  searchParams: Promise<{ psi?: string; modo?: string; erro?: string }>;
}) {
  const { triageId } = await params;
  const { psi, modo, erro } = await searchParams;
  const { supabase } = await requireRole("client");

  const { data: triage } = await supabase.from("triages").select("*").eq("id", triageId).maybeSingle<Triage>();
  if (!triage || triage.status !== "open") redirect("/cliente/atendimentos");

  const [{ data: category }, { data: links }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", triage.category_id).single<Category>(),
    supabase.from("psychologist_categories").select("psychologist_id").eq("category_id", triage.category_id),
  ]);
  const ids = (links ?? []).map((l) => l.psychologist_id as string);
  const { data: psychologists } = ids.length
    ? await supabase
        .from("psychologists")
        .select("id, display_name, crp, bio, approach, photo_url")
        .in("id", ids)
        .eq("active", true)
        .order("display_name")
        .returns<PublicPsychologist[]>()
    : { data: [] as PublicPsychologist[] };

  const chosen = psi ? psychologists?.find((p) => p.id === psi) : undefined;
  const choosing = modo === "profissional" && !chosen;
  const base = `/cliente/agendar/${triage.id}`;

  let slots: Slot[] = [];
  if (!choosing) {
    const { data } = await supabase.rpc("available_slots", {
      p_category_id: triage.category_id,
      p_psychologist_id: chosen?.id ?? null,
    });
    slots = (data as Slot[] | null) ?? [];
  }

  // Modo automático: um botão por horário, independente de quem atende.
  const times = [...new Set(slots.map((s) => s.starts_at))];
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
      <PageHeader
        title="Escolha o melhor horário"
        subtitle={<>{category?.icon} {category?.name} · atendimento online por vídeo</>}
      />
      <Flash erro={erro} />

      {triage.risk_level > 0 && (
        <p className="mb-6 rounded-2xl bg-peach-soft px-4 py-3 text-sm">
          Sua conversa foi marcada como prioritária. Se precisar de ajuda antes do horário, ligue{" "}
          <a href="tel:188" className="font-bold">188 (CVV)</a>.
        </p>
      )}

      <div className="mb-6 inline-flex rounded-full border border-line bg-white p-1 text-sm font-bold">
        <Link href={base} className={`rounded-full px-4 py-2 ${!psi && !choosing ? "bg-primary text-white" : "text-muted"}`}>
          Primeiro horário livre
        </Link>
        <Link
          href={`${base}?modo=profissional`}
          className={`rounded-full px-4 py-2 ${psi || choosing ? "bg-primary text-white" : "text-muted"}`}
        >
          Escolher profissional
        </Link>
      </div>

      {choosing ? (
        psychologists && psychologists.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {psychologists.map((p) => (
              <Card key={p.id} className="flex flex-col">
                <div className="flex items-center gap-4">
                  <Avatar name={p.display_name} url={p.photo_url} />
                  <div>
                    <p className="font-bold">{p.display_name}</p>
                    <p className="text-sm text-muted">CRP {p.crp}</p>
                  </div>
                </div>
                {p.approach && <p className="mt-3 text-sm font-semibold text-primary-dark">{p.approach}</p>}
                {p.bio && <p className="mt-1 line-clamp-4 text-sm text-muted">{p.bio}</p>}
                <Link href={`${base}?psi=${p.id}`} className="mt-4 font-bold text-primary">Ver horários →</Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Ainda não há profissionais neste tema">Tente novamente em breve.</EmptyState>
        )
      ) : (
        <>
          {chosen && (
            <Card className="mb-6 flex items-center gap-4 !p-4">
              <Avatar name={chosen.display_name} url={chosen.photo_url} />
              <div className="flex-1">
                <p className="font-bold">{chosen.display_name}</p>
                <p className="text-sm text-muted">{chosen.approach || `CRP ${chosen.crp}`}</p>
              </div>
              <Link href={`${base}?modo=profissional`} className="text-sm font-bold text-primary">Trocar</Link>
            </Card>
          )}

          {times.length === 0 ? (
            <EmptyState title="Nenhum horário livre no momento">
              Novos horários são abertos com frequência. {chosen ? "Tente outro profissional ou " : ""}volte mais tarde.
            </EmptyState>
          ) : (
            <form action={bookAppointment}>
              <input type="hidden" name="triage_id" value={triage.id} />
              <input type="hidden" name="psychologist_id" value={chosen?.id ?? ""} />
              <SlotPicker days={days} />
              <div className="sticky bottom-0 -mx-4 mt-6 border-t border-line bg-sand/95 px-4 py-4 backdrop-blur">
                <SubmitButton className="w-full py-3 text-base sm:w-auto" pendingText="Agendando…">
                  Confirmar agendamento
                </SubmitButton>
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
