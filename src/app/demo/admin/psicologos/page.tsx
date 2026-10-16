"use client";

import { DEMO_CATEGORIES, DEMO_PSYCHOLOGISTS } from "@/lib/demo/data";
import { WEEKDAYS } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { Badge, Button, Card, Field, Input, PageHeader } from "@/components/ui";

export default function DemoAdminPsychologists() {
  return (
    <>
      <PageHeader title="Psicólogos" subtitle="Cadastre, habilite e desabilite profissionais e defina em quais temas cada um atende." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {DEMO_PSYCHOLOGISTS.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 !p-4">
              <Avatar name={p.display_name} url={null} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{p.display_name}</p>
                <p className="text-sm text-muted">CRP {p.crp} · {p.approach}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.categories.map((id) => (
                    <Badge key={id} tone="lilac">{DEMO_CATEGORIES.find((c) => c.id === id)?.name}</Badge>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Atende: {[...new Set(p.rules.map(([d]) => WEEKDAYS[d].slice(0, 3)))].join(", ")}
                </p>
              </div>
              <Button variant="secondary" className="!px-4 !py-1.5" onClick={() => window.alert("Na versão real, desabilita o profissional: ele some do agendamento.")}>
                Desabilitar
              </Button>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <h2 className="mb-4 font-bold">Cadastrar psicólogo(a)</h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              window.alert("Na versão real, cria o acesso do profissional com e-mail e senha provisória.");
            }}
          >
            <Field label="Nome de exibição"><Input placeholder="Nome do profissional" /></Field>
            <Field label="CRP"><Input placeholder="07/12345" /></Field>
            <Field label="E-mail de acesso"><Input type="email" placeholder="email@exemplo.com" /></Field>
            <div>
              <span className="mb-1.5 block text-sm font-bold">Atende em</span>
              {DEMO_CATEGORIES.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" /> {c.icon} {c.name}
                </label>
              ))}
            </div>
            <Button type="submit" className="w-full">Cadastrar</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
