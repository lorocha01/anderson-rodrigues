"use client";

import { useRouter } from "next/navigation";
import { DEMO_CATEGORIES, DEMO_OPTIONS, DEMO_QUESTIONS } from "@/lib/demo/data";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { TriageFlow } from "@/app/cliente/triagem/triage-flow";
import { useDemo } from "../../store";

export default function DemoTriage() {
  const { plan, remaining, upcoming, submitTriage } = useDemo();
  const router = useRouter();

  if (!plan || remaining === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Quero conversar" />
        <Card className="text-center">
          <p className="font-display text-xl font-semibold">
            {!plan ? "Escolha um plano para começar" : "Seus atendimentos deste período acabaram"}
          </p>
          <p className="mt-2 text-muted">Com um plano ativo você responde a triagem e agenda na hora.</p>
          <ButtonLink href="/demo/cliente/planos" className="mt-5">Ver planos</ButtonLink>
        </Card>
      </div>
    );
  }

  if (upcoming.length > 0) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Quero conversar" />
        <Card className="text-center">
          <p className="font-display text-xl font-semibold">Você já tem um atendimento agendado</p>
          <p className="mt-2 text-muted">Aguarde ele acontecer, ou cancele, para agendar outro.</p>
          <ButtonLink href="/demo/cliente/atendimentos" className="mt-5">Ver meus atendimentos</ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <TriageFlow
        categories={DEMO_CATEGORIES}
        questions={DEMO_QUESTIONS}
        options={DEMO_OPTIONS}
        onSubmit={async (categoryId, optionIds) => {
          const id = submitTriage(categoryId, optionIds);
          router.push(`/demo/cliente/agendar?triagem=${id}`);
        }}
      />
    </div>
  );
}
