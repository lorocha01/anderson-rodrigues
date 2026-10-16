import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, HOME_BY_ROLE } from "@/lib/auth";
import { ButtonLink, Logo, buttonClass } from "@/components/ui";
import { CrisisFooter } from "@/components/crisis";
import { money, sessionsLabel } from "@/lib/format";
import type { Category, Plan } from "@/lib/types";

const STEPS = [
  { title: "Escolha o tema", text: "Família, trabalho, relacionamentos, emoções. Você diz sobre o que quer conversar." },
  { title: "Responda algumas perguntas", text: "Uma triagem rápida e sigilosa direciona você ao grupo de psicólogos certo." },
  { title: "Agende e converse", text: "Escolha o horário (ou o profissional) e faça o atendimento online, por vídeo." },
];

export default async function Home() {
  const supabase = await createClient();
  const [{ data: categories }, { data: plans }, current] = await Promise.all([
    supabase.from("categories").select("*").eq("active", true).order("sort_order").returns<Category[]>(),
    supabase.from("plans").select("*").eq("active", true).order("sort_order").returns<Plan[]>(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo className="text-2xl" />
        {current ? (
          <ButtonLink href={HOME_BY_ROLE[current.profile.role]} variant="secondary">Minha área</ButtonLink>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/entrar" className={buttonClass("ghost")}>Entrar</Link>
            <ButtonLink href="/cadastro" className="hidden sm:inline-flex">Começar</ButtonLink>
          </div>
        )}
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:pt-16">
          <p className="mb-4 inline-block rounded-full bg-lilac-soft px-3 py-1 text-sm font-bold text-lilac">
            Aconselhamento psicológico online
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Alguém para te ouvir, <span className="text-primary">quando você precisa.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Converse com psicólogos de verdade, por um preço que cabe no bolso. Atendimento breve, online e sigiloso,
            com profissionais escolhidos para o seu tema.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/cadastro" className="px-7 py-3 text-base">Quero conversar</ButtonLink>
            <ButtonLink href="#planos" variant="secondary" className="px-7 py-3 text-base">Ver planos</ButtonLink>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-3xl font-semibold">Como funciona</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-3xl bg-sand p-6">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-white">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {categories && categories.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="font-display text-3xl font-semibold">Sobre o que você quer conversar?</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {categories.map((c) => (
                <div key={c.id} className="flex gap-4 rounded-3xl border border-line bg-white p-5">
                  <span className="text-3xl" aria-hidden>{c.icon}</span>
                  <div>
                    <h3 className="font-bold">{c.name}</h3>
                    <p className="text-sm text-muted">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="planos" className="bg-primary-soft/60 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-3xl font-semibold">Planos</h2>
            <p className="mt-2 text-muted">Assine mensalmente ou compre um atendimento avulso. Cancele quando quiser.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(plans ?? []).map((p) => (
                <div
                  key={p.id}
                  className={`flex flex-col rounded-3xl bg-white p-6 ${p.highlighted ? "ring-2 ring-primary" : "border border-line"}`}
                >
                  {p.highlighted && <span className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Mais escolhido</span>}
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                  <p className="mt-4 text-3xl font-extrabold">
                    {money(p.price_cents)}
                    {p.kind === "subscription" && <span className="text-base font-semibold text-muted">/mês</span>}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary-dark">{sessionsLabel(p.sessions_included)}</p>
                  <ButtonLink href={`/cadastro?plano=${p.id}`} variant={p.highlighted ? "primary" : "secondary"} className="mt-6">
                    Escolher
                  </ButtonLink>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-3">
          <div>
            <h3 className="font-bold">Profissionais verificados</h3>
            <p className="mt-1 text-sm text-muted">Todos os psicólogos têm CRP ativo e são selecionados pela nossa equipe.</p>
          </div>
          <div>
            <h3 className="font-bold">Sigilo e LGPD</h3>
            <p className="mt-1 text-sm text-muted">Suas respostas são confidenciais e só o profissional que te atende tem acesso.</p>
          </div>
          <div>
            <h3 className="font-bold">Aconselhamento breve</h3>
            <p className="mt-1 text-sm text-muted">
              Atendimentos pontuais para te ajudar a organizar ideias e encontrar caminhos. Não substitui atendimento de
              urgência.
            </p>
          </div>
        </section>
      </main>
      <CrisisFooter />
    </div>
  );
}
