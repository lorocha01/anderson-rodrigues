import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { type FlashParams } from "@/lib/flash";
import { Badge, Card, EmptyState, Field, Flash, Input, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { deleteOption, deleteQuestion, saveOption, saveQuestion, setRootQuestion } from "../../actions";
import type { Category, TriageOption, TriageQuestion } from "@/lib/types";

export const metadata: Metadata = { title: "Editar triagem" };

const RISK_OPTIONS = [
  { value: 0, label: "Sem risco" },
  { value: 1, label: "Atenção (alerta)" },
  { value: 2, label: "Risco imediato (mostra CVV/SAMU)" },
];

export default async function TriageEditor({ params, searchParams }: { params: Promise<{ categoryId: string }>; searchParams: FlashParams }) {
  const { categoryId: param } = await params;
  const { ok, erro } = await searchParams;
  const { supabase } = await requireRole("admin");
  const isRisk = param === "risco";

  let category: Category | null = null;
  if (!isRisk) {
    const { data } = await supabase.from("categories").select("*").eq("id", param).maybeSingle<Category>();
    if (!data) notFound();
    category = data;
  }
  const categoryId = category?.id ?? "";

  const questionQuery = supabase.from("triage_questions").select("*").order("sort_order").order("created_at");
  const { data: questions } = await (isRisk ? questionQuery.is("category_id", null) : questionQuery.eq("category_id", categoryId)).returns<TriageQuestion[]>();
  const qs = questions ?? [];
  const { data: options } = qs.length
    ? await supabase.from("triage_options").select("*").in("question_id", qs.map((q) => q.id)).order("sort_order").returns<TriageOption[]>()
    : { data: [] as TriageOption[] };

  const optionsOf = (qid: string) => (options ?? []).filter((o) => o.question_id === qid);

  // Perguntas que nenhuma opção alcança (e que não são a inicial).
  const reachable = new Set<string>();
  const root = qs.find((q) => q.is_root);
  const stack = root ? [root.id] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const o of optionsOf(id)) if (o.next_question_id) stack.push(o.next_question_id);
  }

  return (
    <>
      <Link href="/admin/triagem" className="mb-3 inline-block text-sm font-bold text-muted hover:text-ink">← Todas as categorias</Link>
      <PageHeader
        title={isRisk ? "🛟 Pergunta de segurança" : `${category?.icon} ${category?.name}`}
        subtitle={
          isRisk
            ? "Pergunta única feita a todos no início da triagem. Marque o nível de risco de cada resposta."
            : "Cada resposta pode levar a outra pergunta. Sem próxima pergunta, a triagem termina e o cliente vai para o agendamento."
        }
      />
      <Flash ok={ok} erro={erro} />

      <div className="space-y-5">
        {qs.length === 0 && <EmptyState title="Nenhuma pergunta ainda">Crie a primeira pergunta abaixo.</EmptyState>}
        {qs.map((q, index) => (
          <Card key={q.id} className={q.is_root ? "ring-2 ring-primary" : ""}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-muted">Pergunta {index + 1}</span>
              {q.is_root && <Badge tone="primary">Pergunta inicial</Badge>}
              {!isRisk && !reachable.has(q.id) && <Badge tone="peach">Nenhuma resposta leva até aqui</Badge>}
            </div>

            <form action={saveQuestion} className="grid gap-3 sm:grid-cols-[1fr_1fr_80px_auto] sm:items-end">
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="category_id" value={categoryId} />
              <Field label="Pergunta">
                <Input name="text" defaultValue={q.text} required />
              </Field>
              <Field label="Texto de apoio" hint="opcional">
                <Input name="help_text" defaultValue={q.help_text} />
              </Field>
              <Field label="Ordem">
                <Input name="sort_order" type="number" defaultValue={q.sort_order} />
              </Field>
              <SubmitButton variant="secondary" className="!px-4">Salvar</SubmitButton>
            </form>

            <div className="mt-4 space-y-2">
              {optionsOf(q.id).map((o) => (
                <div key={o.id} className="flex flex-wrap items-end gap-2 rounded-2xl bg-sand p-3">
                  <form action={saveOption} className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_64px_auto] sm:items-end">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="category_id" value={categoryId} />
                    <Field label="Resposta">
                      <Input name="label" defaultValue={o.label} required />
                    </Field>
                    {!isRisk ? (
                      <Field label="Leva para">
                        <Select name="next_question_id" defaultValue={o.next_question_id ?? ""}>
                          <option value="">Fim → agendamento</option>
                          {qs.filter((x) => x.id !== q.id).map((x) => (
                            <option key={x.id} value={x.id}>{x.text}</option>
                          ))}
                        </Select>
                      </Field>
                    ) : (
                      <input type="hidden" name="next_question_id" value="" />
                    )}
                    <Field label="Risco">
                      <Select name="risk_level" defaultValue={o.risk_level}>
                        {RISK_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </Select>
                    </Field>
                    <Field label="Ordem">
                      <Input name="sort_order" type="number" defaultValue={o.sort_order} />
                    </Field>
                    <SubmitButton variant="secondary" className="!px-4">Salvar</SubmitButton>
                  </form>
                  <form action={deleteOption}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="category_id" value={categoryId} />
                    <SubmitButton variant="ghost" className="!px-3 !text-danger hover:!bg-danger-soft" confirm="Remover esta resposta?">Remover</SubmitButton>
                  </form>
                </div>
              ))}

              <form action={saveOption} className="grid gap-2 rounded-2xl border border-dashed border-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                <input type="hidden" name="question_id" value={q.id} />
                <input type="hidden" name="category_id" value={categoryId} />
                <input type="hidden" name="sort_order" value={optionsOf(q.id).length + 1} />
                <Field label="Nova resposta">
                  <Input name="label" required placeholder="Texto da opção" />
                </Field>
                {!isRisk ? (
                  <Field label="Leva para">
                    <Select name="next_question_id" defaultValue="">
                      <option value="">Fim → agendamento</option>
                      {qs.filter((x) => x.id !== q.id).map((x) => <option key={x.id} value={x.id}>{x.text}</option>)}
                    </Select>
                  </Field>
                ) : (
                  <input type="hidden" name="next_question_id" value="" />
                )}
                <Field label="Risco">
                  <Select name="risk_level" defaultValue={0}>
                    {RISK_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                </Field>
                <SubmitButton className="!px-4">Adicionar</SubmitButton>
              </form>
            </div>

            {!isRisk && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {!q.is_root && (
                  <form action={setRootQuestion}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="category_id" value={categoryId} />
                    <SubmitButton variant="ghost" className="!px-3">Tornar pergunta inicial</SubmitButton>
                  </form>
                )}
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="category_id" value={categoryId} />
                  <SubmitButton variant="ghost" className="!px-3 !text-danger hover:!bg-danger-soft" confirm="Excluir esta pergunta e todas as respostas dela?">
                    Excluir pergunta
                  </SubmitButton>
                </form>
              </div>
            )}
          </Card>
        ))}

        {(!isRisk || qs.length === 0) && (
          <Card className="border-dashed">
            <p className="mb-3 font-bold">Nova pergunta</p>
            <form action={saveQuestion} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="category_id" value={categoryId} />
              <input type="hidden" name="sort_order" value={qs.length + 1} />
              <Field label="Pergunta">
                <Input name="text" required />
              </Field>
              <Field label="Texto de apoio" hint="opcional">
                <Input name="help_text" />
              </Field>
              <SubmitButton>Criar</SubmitButton>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
