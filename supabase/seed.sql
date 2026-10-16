-- Dados iniciais da AconselhA: categorias, árvore de triagem e planos.
-- Valores de exemplo: ajuste no painel admin.

do $$
declare
  c_familia uuid; c_trabalho uuid; c_relac uuid; c_emocoes uuid;
  q_risk uuid;
  q1 uuid; q2 uuid; q3 uuid;
begin
  -- Categorias ---------------------------------------------------------------
  insert into public.categories (slug, name, description, icon, sort_order) values
    ('familia', 'Família', 'Conflitos familiares, relação com filhos, pais e irmãos.', '🏡', 1)
    returning id into c_familia;
  insert into public.categories (slug, name, description, icon, sort_order) values
    ('trabalho', 'Trabalho e carreira', 'Estresse, esgotamento, desemprego e conflitos no trabalho.', '💼', 2)
    returning id into c_trabalho;
  insert into public.categories (slug, name, description, icon, sort_order) values
    ('relacionamentos', 'Relacionamentos', 'Vida a dois, separação, solidão e amizades.', '💞', 3)
    returning id into c_relac;
  insert into public.categories (slug, name, description, icon, sort_order) values
    ('emocoes', 'Emoções e ansiedade', 'Ansiedade, tristeza, luto e autoestima.', '🌱', 4)
    returning id into c_emocoes;

  -- Pergunta global de segurança --------------------------------------------
  insert into public.triage_questions (category_id, text, help_text, is_root)
  values (null,
    'Antes de começar: como você está em relação à sua segurança neste momento?',
    'Sua resposta é confidencial e nos ajuda a cuidar melhor de você.',
    false)
  returning id into q_risk;
  insert into public.triage_options (question_id, label, risk_level, sort_order) values
    (q_risk, 'Estou em segurança', 0, 1),
    (q_risk, 'Às vezes penso em me machucar ou em sumir', 1, 2),
    (q_risk, 'Estou pensando em tirar minha vida agora', 2, 3);

  -- Família ------------------------------------------------------------------
  insert into public.triage_questions (category_id, text, is_root, sort_order)
    values (c_familia, 'Com quem é a situação que mais te preocupa?', true, 1) returning id into q1;
  insert into public.triage_questions (category_id, text, sort_order)
    values (c_familia, 'Há quanto tempo isso está acontecendo?', 2) returning id into q2;
  insert into public.triage_questions (category_id, text, sort_order)
    values (c_familia, 'Existe alguma situação de violência ou ameaça em casa?', 3) returning id into q3;
  insert into public.triage_options (question_id, label, next_question_id, sort_order) values
    (q1, 'Filhos', q2, 1), (q1, 'Pais', q2, 2), (q1, 'Irmãos ou outros parentes', q2, 3), (q1, 'Família toda', q2, 4);
  insert into public.triage_options (question_id, label, next_question_id, sort_order) values
    (q2, 'Começou agora (menos de um mês)', q3, 1), (q2, 'Alguns meses', q3, 2), (q2, 'Mais de um ano', q3, 3);
  insert into public.triage_options (question_id, label, risk_level, sort_order) values
    (q3, 'Não', 0, 1), (q3, 'Já aconteceu, mas não agora', 1, 2), (q3, 'Sim, estou em risco', 2, 3);

  -- Trabalho -----------------------------------------------------------------
  insert into public.triage_questions (category_id, text, is_root, sort_order)
    values (c_trabalho, 'O que melhor descreve o seu momento?', true, 1) returning id into q1;
  insert into public.triage_questions (category_id, text, sort_order)
    values (c_trabalho, 'Isso está afetando seu sono, apetite ou saúde?', 2) returning id into q2;
  insert into public.triage_options (question_id, label, next_question_id, sort_order) values
    (q1, 'Estou sobrecarregado(a) ou esgotado(a)', q2, 1),
    (q1, 'Conflito com chefia ou colegas', q2, 2),
    (q1, 'Estou desempregado(a) ou com medo de perder o emprego', q2, 3),
    (q1, 'Dúvidas sobre carreira e mudanças', q2, 4);
  insert into public.triage_options (question_id, label, sort_order) values
    (q2, 'Não', 1), (q2, 'Um pouco', 2), (q2, 'Muito', 3);

  -- Relacionamentos ----------------------------------------------------------
  insert into public.triage_questions (category_id, text, is_root, sort_order)
    values (c_relac, 'Sobre qual relação você quer conversar?', true, 1) returning id into q1;
  insert into public.triage_questions (category_id, text, sort_order)
    values (c_relac, 'Você se sente seguro(a) nessa relação?', 2) returning id into q2;
  insert into public.triage_questions (category_id, text, sort_order)
    values (c_relac, 'O que você mais gostaria de trabalhar?', 3) returning id into q3;
  insert into public.triage_options (question_id, label, next_question_id, sort_order) values
    (q1, 'Namoro ou casamento', q2, 1),
    (q1, 'Separação ou término', q3, 2),
    (q1, 'Solidão ou dificuldade de me relacionar', q3, 3),
    (q1, 'Amizades', q3, 4);
  insert into public.triage_options (question_id, label, next_question_id, risk_level, sort_order) values
    (q2, 'Sim', q3, 0, 1),
    (q2, 'Nem sempre', q3, 1, 2),
    (q2, 'Não, tenho medo da outra pessoa', q3, 2, 3);
  insert into public.triage_options (question_id, label, sort_order) values
    (q3, 'Comunicação', 1), (q3, 'Ciúmes e confiança', 2), (q3, 'Seguir em frente', 3), (q3, 'Ainda não sei', 4);

  -- Emoções e ansiedade ------------------------------------------------------
  insert into public.triage_questions (category_id, text, is_root, sort_order)
    values (c_emocoes, 'O que você tem sentido com mais frequência?', true, 1) returning id into q1;
  insert into public.triage_questions (category_id, text, sort_order)
    values (c_emocoes, 'Com que frequência isso acontece?', 2) returning id into q2;
  insert into public.triage_questions (category_id, text, sort_order)
    values (c_emocoes, 'Você já fez algum acompanhamento psicológico antes?', 3) returning id into q3;
  insert into public.triage_options (question_id, label, next_question_id, sort_order) values
    (q1, 'Ansiedade ou preocupação constante', q2, 1),
    (q1, 'Tristeza ou desânimo', q2, 2),
    (q1, 'Luto ou perda recente', q2, 3),
    (q1, 'Baixa autoestima ou insegurança', q2, 4);
  insert into public.triage_options (question_id, label, next_question_id, sort_order) values
    (q2, 'De vez em quando', q3, 1), (q2, 'Quase todos os dias', q3, 2), (q2, 'O tempo todo', q3, 3);
  insert into public.triage_options (question_id, label, sort_order) values
    (q3, 'Sim', 1), (q3, 'Não, é a primeira vez', 2);

  -- Planos -------------------------------------------------------------------
  insert into public.plans (name, description, kind, sessions_included, price_cents, duration_days, highlighted, sort_order) values
    ('Essencial', '1 atendimento por mês', 'subscription', 1, 4990, 30, false, 1),
    ('Cuidado', '2 atendimentos por mês', 'subscription', 2, 8990, 30, true, 2),
    ('Livre', 'Atendimentos livres no mês (1 agendamento por vez)', 'subscription', null, 14990, 30, false, 3),
    ('Avulso', '1 atendimento, válido por 60 dias', 'package', 1, 6990, 60, false, 4);
end $$;
