import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { Badge, Card, PageHeader } from "@/components/ui";
import type { Category, TriageQuestion } from "@/lib/types";

export const metadata: Metadata = { title: "Perguntas da triagem" };

export default async function AdminTriageIndex() {
  const { supabase } = await requireRole("admin");
  const [{ data: categories }, { data: questions }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").returns<Category[]>(),
    supabase.from("triage_questions").select("id, category_id, is_root").returns<Pick<TriageQuestion, "id" | "category_id" | "is_root">[]>(),
  ]);
  const count = (id: string) => (questions ?? []).filter((q) => q.category_id === id).length;
  const hasRoot = (id: string) => (questions ?? []).some((q) => q.category_id === id && q.is_root);

  return (
    <>
      <PageHeader
        title="Perguntas da triagem"
        subtitle="Fluxo do cliente: pergunta de segurança → escolha do tema → perguntas do tema → agendamento."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/triagem/risco">
          <Card className="h-full !border-danger/30 transition hover:!border-danger">
            <p className="font-bold">🛟 Pergunta de segurança</p>
            <p className="mt-1 text-sm text-muted">Feita a todos no início. Respostas de risco mostram o CVV/SAMU e geram alerta.</p>
          </Card>
        </Link>
        {(categories ?? []).map((c) => (
          <Link key={c.id} href={`/admin/triagem/${c.id}`}>
            <Card className="h-full transition hover:border-primary">
              <p className="font-bold">{c.icon} {c.name}</p>
              <p className="mt-1 text-sm text-muted">{count(c.id)} pergunta(s)</p>
              {!hasRoot(c.id) && <span className="mt-2 inline-block"><Badge tone="peach">sem pergunta inicial</Badge></span>}
              {!c.active && <span className="ml-1 mt-2 inline-block"><Badge>inativa</Badge></span>}
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
