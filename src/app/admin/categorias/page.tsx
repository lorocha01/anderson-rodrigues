import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { type FlashParams } from "@/lib/flash";
import { Card, Field, Flash, Input, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { saveCategory } from "../actions";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Categorias" };

function CategoryForm({ category }: { category?: Category }) {
  return (
    <form action={saveCategory} className="grid gap-3 sm:grid-cols-[72px_1fr_1fr_80px_auto] sm:items-end">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <Field label="Ícone">
        <Input name="icon" defaultValue={category?.icon ?? "💬"} maxLength={4} className="text-center" />
      </Field>
      <Field label="Nome">
        <Input name="name" defaultValue={category?.name} required />
      </Field>
      <Field label="Descrição">
        <Input name="description" defaultValue={category?.description} />
      </Field>
      <Field label="Ordem">
        <Input name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} />
      </Field>
      <div className="flex items-center gap-3 pb-1">
        <label className="flex items-center gap-1.5 text-sm font-bold">
          <input type="checkbox" name="active" defaultChecked={category?.active ?? true} className="size-4 accent-primary" /> Ativa
        </label>
        <SubmitButton className="!px-4">{category ? "Salvar" : "Criar"}</SubmitButton>
      </div>
    </form>
  );
}

export default async function AdminCategories({ searchParams }: { searchParams: FlashParams }) {
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order").returns<Category[]>();

  return (
    <>
      <PageHeader title="Categorias" subtitle="Temas que o cliente escolhe na triagem. Cada um tem seu grupo de psicólogos e sua árvore de perguntas." />
      <Flash ok={ok} erro={erro} />
      <div className="space-y-3">
        {(categories ?? []).map((c) => (
          <Card key={c.id} className="!p-4">
            <CategoryForm category={c} />
            <Link href={`/admin/triagem/${c.id}`} className="mt-2 inline-block text-sm font-bold text-primary">
              Editar perguntas da triagem →
            </Link>
          </Card>
        ))}
        <Card className="!p-4 border-dashed">
          <p className="mb-3 font-bold">Nova categoria</p>
          <CategoryForm />
        </Card>
      </div>
    </>
  );
}
