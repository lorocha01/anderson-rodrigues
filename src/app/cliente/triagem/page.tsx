import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { availableSessions, currentMemberships } from "@/lib/client-data";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { TriageFlow } from "./triage-flow";
import type { Category, TriageOption, TriageQuestion } from "@/lib/types";

export const metadata: Metadata = { title: "Quero conversar" };

export default async function TriagePage() {
  const { supabase } = await requireRole("client");
  const memberships = await currentMemberships(supabase);
  const available = availableSessions(memberships);

  if (memberships.length === 0 || available === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Quero conversar" />
        <Card className="text-center">
          <p className="font-display text-xl font-semibold">
            {memberships.length === 0 ? "Escolha um plano para começar" : "Seus atendimentos deste período acabaram"}
          </p>
          <p className="mt-2 text-muted">Com um plano ativo você responde a triagem e agenda na hora.</p>
          <ButtonLink href="/cliente/planos" className="mt-5">Ver planos</ButtonLink>
        </Card>
      </div>
    );
  }

  const [{ data: categories }, { data: questions }, { data: options }] = await Promise.all([
    supabase.from("categories").select("*").eq("active", true).order("sort_order").returns<Category[]>(),
    supabase.from("triage_questions").select("*").order("sort_order").returns<TriageQuestion[]>(),
    supabase.from("triage_options").select("*").order("sort_order").returns<TriageOption[]>(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <TriageFlow categories={categories ?? []} questions={questions ?? []} options={options ?? []} />
    </div>
  );
}
