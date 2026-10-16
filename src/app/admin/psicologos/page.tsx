import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { type FlashParams } from "@/lib/flash";
import { Avatar } from "@/components/avatar";
import { Badge, Card, EmptyState, Field, Flash, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createPsychologist, togglePsychologist } from "../actions";
import type { Category, Psychologist } from "@/lib/types";

export const metadata: Metadata = { title: "Psicólogos" };

export default async function AdminPsychologists({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");
  const admin = createAdminClient();
  const [{ data: psychologists }, { data: links }, { data: categories }, { data: rules }] = await Promise.all([
    admin.from("psychologists").select("*").order("display_name").returns<Psychologist[]>(),
    supabase.from("psychologist_categories").select("*"),
    supabase.from("categories").select("*").order("sort_order").returns<Category[]>(),
    supabase.from("availability_rules").select("psychologist_id"),
  ]);
  const catName = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const catsOf = (id: string) => (links ?? []).filter((l) => l.psychologist_id === id).map((l) => catName.get(l.category_id as string));
  const hasAvailability = new Set((rules ?? []).map((r) => r.psychologist_id as string));

  return (
    <>
      <PageHeader title="Psicólogos" subtitle="Cadastre, habilite e desabilite profissionais e defina em quais temas cada um atende." />
      <Flash ok={ok} erro={erro} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {(psychologists ?? []).length === 0 && <EmptyState title="Nenhum psicólogo cadastrado ainda" />}
          {(psychologists ?? []).map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 !p-4">
              <Avatar name={p.display_name} url={p.photo_url} />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/psicologos/${p.id}`} className="font-bold hover:text-primary">{p.display_name}</Link>
                <p className="text-sm text-muted">CRP {p.crp}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {catsOf(p.id).map((n) => <Badge key={n} tone="lilac">{n}</Badge>)}
                  {!p.meet_url && <Badge tone="peach">sem link do Meet</Badge>}
                  {!hasAvailability.has(p.id) && <Badge tone="peach">sem disponibilidade</Badge>}
                </div>
              </div>
              <form action={togglePsychologist}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={String(!p.active)} />
                <SubmitButton variant={p.active ? "secondary" : "primary"} className="!px-4 !py-1.5">
                  {p.active ? "Desabilitar" : "Habilitar"}
                </SubmitButton>
              </form>
              {!p.active && <Badge>Desabilitado</Badge>}
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <h2 className="mb-4 font-bold">Cadastrar psicólogo(a)</h2>
          <form action={createPsychologist} className="space-y-4">
            <Field label="Nome de exibição">
              <Input name="display_name" required />
            </Field>
            <Field label="CRP">
              <Input name="crp" placeholder="07/12345" required />
            </Field>
            <Field label="E-mail de acesso">
              <Input name="email" type="email" required />
            </Field>
            <Field label="Senha provisória" hint="mín. 8">
              <Input name="password" type="text" minLength={8} required />
            </Field>
            <div>
              <span className="mb-1.5 block text-sm font-bold">Atende em</span>
              <div className="space-y-1">
                {(categories ?? []).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="category_id" value={c.id} className="size-4 accent-primary" />
                    {c.icon} {c.name}
                  </label>
                ))}
              </div>
            </div>
            <SubmitButton className="w-full" pendingText="Cadastrando…">Cadastrar</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
