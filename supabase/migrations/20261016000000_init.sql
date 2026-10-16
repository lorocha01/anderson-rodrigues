-- AconselhA: schema inicial
-- Perfis: client (cliente), psychologist (psicólogo), admin.
-- Leituras são protegidas por RLS. Escritas sensíveis (triagem, agendamento,
-- cancelamento, resultado) passam por funções security definer; compras
-- passam pelo servidor com a service_role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('client', 'psychologist', 'admin');
create type public.plan_kind as enum ('subscription', 'package');
create type public.membership_status as enum ('pending', 'active', 'canceled', 'expired');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.triage_status as enum ('open', 'scheduled', 'closed');
create type public.appointment_status as enum ('scheduled', 'completed', 'canceled', 'no_show');

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text not null default '',
  phone text,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.psychologists (
  id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null,
  crp text not null,
  bio text not null default '',
  approach text not null default '',
  photo_url text,
  meet_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default '💬',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.psychologist_categories (
  psychologist_id uuid not null references public.psychologists (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (psychologist_id, category_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  kind public.plan_kind not null,
  -- null = atendimentos livres (ilimitados) no período
  sessions_included int check (sessions_included is null or sessions_included > 0),
  price_cents int not null check (price_cents >= 0),
  -- assinatura: duração do ciclo; pacote: validade dos créditos
  duration_days int not null default 30 check (duration_days > 0),
  highlighted boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Cada linha é um ciclo de assinatura ou um pacote comprado.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  kind public.plan_kind not null,
  plan_name text not null,
  sessions_total int,
  price_cents int not null,
  status public.membership_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index memberships_client_idx on public.memberships (client_id, status);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents int not null,
  status public.payment_status not null default 'pending',
  provider text not null default 'mock',
  provider_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Árvore de triagem. category_id nulo = pergunta global de segurança (risco).
create table public.triage_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete cascade,
  text text not null,
  help_text text not null default '',
  is_root boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
-- Uma pergunta inicial por categoria e uma única pergunta global de risco.
create unique index triage_root_per_category on public.triage_questions (category_id) where is_root and category_id is not null;
create unique index triage_single_risk_screen on public.triage_questions ((category_id is null)) where category_id is null;

create table public.triage_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.triage_questions (id) on delete cascade,
  label text not null,
  next_question_id uuid references public.triage_questions (id) on delete set null,
  -- 0 = sem risco, 1 = atenção, 2 = risco imediato
  risk_level smallint not null default 0 check (risk_level between 0 and 2),
  sort_order int not null default 0
);

create table public.triages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  answers jsonb not null default '[]'::jsonb,
  risk_level smallint not null default 0,
  status public.triage_status not null default 'open',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index triages_client_idx on public.triages (client_id, created_at desc);
create index triages_risk_idx on public.triages (risk_level) where risk_level > 0;

-- Disponibilidade semanal (horário de Brasília).
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologists (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index availability_psy_idx on public.availability_rules (psychologist_id, weekday);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  psychologist_id uuid not null references public.psychologists (id),
  category_id uuid not null references public.categories (id),
  triage_id uuid references public.triages (id) on delete set null,
  membership_id uuid not null references public.memberships (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  meet_url text,
  credit_refunded boolean not null default false,
  canceled_at timestamptz,
  canceled_by public.user_role,
  cancel_reason text,
  created_at timestamptz not null default now()
);
create unique index appointments_no_double_booking on public.appointments (psychologist_id, starts_at) where status = 'scheduled';
create index appointments_client_idx on public.appointments (client_id, starts_at desc);
create index appointments_psy_idx on public.appointments (psychologist_id, starts_at);

-- Configurações gerais (linha única).
create table public.settings (
  id boolean primary key default true check (id),
  session_minutes int not null default 50 check (session_minutes between 15 and 180),
  cancel_window_hours int not null default 24 check (cancel_window_hours >= 0),
  min_notice_hours int not null default 2 check (min_notice_hours >= 0),
  booking_horizon_days int not null default 21 check (booking_horizon_days between 1 and 90),
  max_open_appointments int not null default 1 check (max_open_appointments >= 1),
  updated_at timestamptz not null default now()
);
insert into public.settings default values;

-- ---------------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;

-- Cria o perfil quando um usuário se cadastra. Sempre como cliente: o papel
-- de psicólogo/admin só é atribuído pelo servidor (service_role) ou pelo admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, consent_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    case when (new.raw_user_meta_data ->> 'consent') = 'true' then now() end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Saldo de cada ciclo/pacote. Consome crédito: agendado, realizado, falta e
-- cancelamento sem devolução.
create or replace view public.membership_balances
with (security_invoker = true) as
select
  m.*,
  (
    select count(*)::int from public.appointments a
    where a.membership_id = m.id
      and (a.status in ('scheduled', 'completed', 'no_show')
           or (a.status = 'canceled' and not a.credit_refunded))
  ) as sessions_used,
  case when m.sessions_total is null then null
       else greatest(m.sessions_total - (
         select count(*)::int from public.appointments a
         where a.membership_id = m.id
           and (a.status in ('scheduled', 'completed', 'no_show')
                or (a.status = 'canceled' and not a.credit_refunded))
       ), 0)
  end as sessions_remaining,
  (m.status = 'active' and now() >= m.starts_at and now() < m.ends_at) as is_current
from public.memberships m;

-- Horários livres para uma categoria (e opcionalmente um psicólogo).
create or replace function public.available_slots(
  p_category_id uuid,
  p_psychologist_id uuid default null
)
returns table (psychologist_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public
as $$
  with st as (select * from public.settings limit 1)
  select distinct r.psychologist_id, slot, slot + make_interval(mins => st.session_minutes)
  from public.availability_rules r
  join public.psychologists p on p.id = r.psychologist_id and p.active
  join public.psychologist_categories pc on pc.psychologist_id = p.id and pc.category_id = p_category_id
  cross join st
  cross join lateral generate_series(0, st.booking_horizon_days - 1) as d(n)
  cross join lateral (select (timezone('America/Sao_Paulo', now()))::date + d.n as day) dd
  cross join lateral generate_series(
    (dd.day + r.start_time) at time zone 'America/Sao_Paulo',
    (dd.day + r.end_time - make_interval(mins => st.session_minutes)) at time zone 'America/Sao_Paulo',
    make_interval(mins => st.session_minutes)
  ) as slot
  where extract(dow from dd.day) = r.weekday
    and (p_psychologist_id is null or r.psychologist_id = p_psychologist_id)
    and slot >= now() + make_interval(hours => st.min_notice_hours)
    and not exists (
      select 1 from public.appointments a
      where a.psychologist_id = r.psychologist_id
        and a.status = 'scheduled'
        and a.starts_at < slot + make_interval(mins => st.session_minutes)
        and a.ends_at > slot
    )
  order by 2, 1
$$;

-- Registra a triagem a partir das opções escolhidas (o servidor calcula o risco).
create or replace function public.submit_triage(p_category_id uuid, p_option_ids uuid[])
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_answers jsonb;
  v_risk smallint;
  v_count int;
  v_id uuid;
begin
  if v_uid is null or public.my_role() <> 'client' then
    raise exception 'Apenas clientes podem fazer a triagem.';
  end if;
  if not exists (select 1 from public.categories where id = p_category_id and active) then
    raise exception 'Categoria inválida.';
  end if;
  if coalesce(array_length(p_option_ids, 1), 0) = 0 then
    raise exception 'Responda pelo menos uma pergunta.';
  end if;

  select count(*),
         coalesce(max(o.risk_level), 0),
         jsonb_agg(jsonb_build_object(
           'question', q.text, 'answer', o.label, 'risk_level', o.risk_level
         ) order by x.ord)
    into v_count, v_risk, v_answers
  from unnest(p_option_ids) with ordinality as x(option_id, ord)
  join public.triage_options o on o.id = x.option_id
  join public.triage_questions q on q.id = o.question_id
  where q.category_id is null or q.category_id = p_category_id;

  if v_count <> array_length(p_option_ids, 1) then
    raise exception 'Respostas inválidas.';
  end if;

  insert into public.triages (client_id, category_id, answers, risk_level)
  values (v_uid, p_category_id, v_answers, v_risk)
  returning id into v_id;
  return v_id;
end;
$$;

-- Agenda um atendimento. p_psychologist_id nulo = o sistema escolhe quem está
-- livre no horário (o com menos atendimentos nos próximos 7 dias).
create or replace function public.book_appointment(
  p_triage_id uuid,
  p_starts_at timestamptz,
  p_psychologist_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_triage public.triages;
  v_settings public.settings;
  v_psy uuid;
  v_membership uuid;
  v_open int;
  v_id uuid;
begin
  if v_uid is null or public.my_role() <> 'client' then
    raise exception 'Apenas clientes podem agendar.';
  end if;

  select * into v_triage from public.triages where id = p_triage_id and client_id = v_uid for update;
  if not found then raise exception 'Triagem não encontrada.'; end if;
  if v_triage.status <> 'open' then raise exception 'Esta triagem já foi agendada.'; end if;

  select * into v_settings from public.settings limit 1;

  -- Serializa agendamentos do mesmo cliente.
  perform pg_advisory_xact_lock(hashtext('client:' || v_uid::text));

  select count(*) into v_open from public.appointments
  where client_id = v_uid and status = 'scheduled' and starts_at > now();
  if v_open >= v_settings.max_open_appointments then
    raise exception 'Você já tem um atendimento agendado. Aguarde ele acontecer para agendar outro.';
  end if;

  -- Escolhe o psicólogo com o horário livre.
  select s.psychologist_id into v_psy
  from public.available_slots(v_triage.category_id, p_psychologist_id) s
  where s.starts_at = p_starts_at
  order by (
    select count(*) from public.appointments a
    where a.psychologist_id = s.psychologist_id and a.status = 'scheduled'
      and a.starts_at between now() and now() + interval '7 days'
  ), random()
  limit 1;
  if v_psy is null then
    raise exception 'Este horário não está mais disponível. Escolha outro.';
  end if;

  perform pg_advisory_xact_lock(hashtext('psy:' || v_psy::text));

  -- Usa o ciclo/pacote vigente que vence primeiro e ainda tem saldo.
  select b.id into v_membership
  from public.membership_balances b
  where b.client_id = v_uid and b.is_current
    and (b.sessions_remaining is null or b.sessions_remaining > 0)
    and p_starts_at < b.ends_at
  order by b.ends_at
  limit 1;
  if v_membership is null then
    raise exception 'Você não tem atendimentos disponíveis no seu plano para esta data.';
  end if;

  insert into public.appointments (
    client_id, psychologist_id, category_id, triage_id, membership_id,
    starts_at, ends_at, meet_url
  )
  select v_uid, v_psy, v_triage.category_id, v_triage.id, v_membership,
         p_starts_at, p_starts_at + make_interval(mins => v_settings.session_minutes), p.meet_url
  from public.psychologists p where p.id = v_psy
  returning id into v_id;

  update public.triages set status = 'scheduled' where id = v_triage.id;
  return v_id;
exception
  when unique_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro.';
end;
$$;

-- Cancela um atendimento. Cliente: devolve o crédito se cancelar dentro do
-- prazo configurado. Psicólogo/admin: sempre devolve.
create or replace function public.cancel_appointment(p_appointment_id uuid, p_reason text default null)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.my_role();
  v_appt public.appointments;
  v_window int;
  v_refund boolean;
begin
  select * into v_appt from public.appointments where id = p_appointment_id for update;
  if not found then raise exception 'Atendimento não encontrado.'; end if;
  if v_appt.status <> 'scheduled' then raise exception 'Este atendimento não pode mais ser cancelado.'; end if;

  if v_role = 'admin' or (v_role = 'psychologist' and v_appt.psychologist_id = v_uid) then
    v_refund := true;
  elsif v_role = 'client' and v_appt.client_id = v_uid then
    if v_appt.starts_at <= now() then raise exception 'O horário deste atendimento já passou.'; end if;
    select cancel_window_hours into v_window from public.settings limit 1;
    v_refund := v_appt.starts_at - now() >= make_interval(hours => v_window);
  else
    raise exception 'Sem permissão.';
  end if;

  update public.appointments
     set status = 'canceled', canceled_at = now(), canceled_by = v_role,
         cancel_reason = nullif(trim(p_reason), ''), credit_refunded = v_refund
   where id = v_appt.id;

  -- Libera a triagem para reagendar.
  if v_appt.triage_id is not null then
    update public.triages set status = 'open' where id = v_appt.triage_id;
  end if;
  return v_refund;
end;
$$;

-- Psicólogo (ou admin) registra se o atendimento aconteceu.
create or replace function public.set_appointment_outcome(p_appointment_id uuid, p_status public.appointment_status)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_appt public.appointments;
begin
  if p_status not in ('completed', 'no_show') then
    raise exception 'Status inválido.';
  end if;
  select * into v_appt from public.appointments where id = p_appointment_id for update;
  if not found then raise exception 'Atendimento não encontrado.'; end if;
  if not (public.is_admin() or v_appt.psychologist_id = v_uid) then
    raise exception 'Sem permissão.';
  end if;
  if v_appt.status not in ('scheduled', 'completed', 'no_show') then
    raise exception 'Atendimento cancelado.';
  end if;
  if v_appt.starts_at > now() then
    raise exception 'O atendimento ainda não começou.';
  end if;
  update public.appointments set status = p_status where id = v_appt.id;
  if v_appt.triage_id is not null then
    update public.triages set status = 'closed' where id = v_appt.triage_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.psychologists enable row level security;
alter table public.categories enable row level security;
alter table public.psychologist_categories enable row level security;
alter table public.plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.triage_questions enable row level security;
alter table public.triage_options enable row level security;
alter table public.triages enable row level security;
alter table public.availability_rules enable row level security;
alter table public.appointments enable row level security;
alter table public.settings enable row level security;

-- profiles
create policy "perfil próprio" on public.profiles for select using (id = auth.uid());
create policy "admin vê perfis" on public.profiles for select using (public.is_admin());
create policy "psicólogo vê seus clientes" on public.profiles for select using (
  exists (select 1 from public.appointments a where a.client_id = profiles.id and a.psychologist_id = auth.uid())
);
create policy "edita perfil próprio" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admin edita perfis" on public.profiles for update using (public.is_admin());
-- O usuário só altera nome e telefone; o papel muda via admin/service_role.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- psychologists: diretório visível para logados (sem meet_url, ver grants abaixo)
create policy "diretório de psicólogos" on public.psychologists for select to authenticated using (active or id = auth.uid() or public.is_admin());
create policy "admin gerencia psicólogos" on public.psychologists for all using (public.is_admin()) with check (public.is_admin());
create policy "psicólogo edita o próprio" on public.psychologists for update using (id = auth.uid()) with check (id = auth.uid());
revoke select, update on public.psychologists from authenticated, anon;
grant select (id, display_name, crp, bio, approach, photo_url, active, created_at) on public.psychologists to authenticated;
grant update (bio, approach, photo_url, meet_url) on public.psychologists to authenticated;

-- categorias e planos: públicos (landing page)
create policy "categorias ativas" on public.categories for select using (active or public.is_admin());
create policy "admin gerencia categorias" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "planos ativos" on public.plans for select using (active or public.is_admin());
create policy "admin gerencia planos" on public.plans for all using (public.is_admin()) with check (public.is_admin());

create policy "vínculos visíveis" on public.psychologist_categories for select to authenticated using (true);
create policy "admin gerencia vínculos" on public.psychologist_categories for all using (public.is_admin()) with check (public.is_admin());

-- memberships e pagamentos: escrita só pelo servidor (service_role)
create policy "minhas assinaturas" on public.memberships for select using (client_id = auth.uid() or public.is_admin());
create policy "meus pagamentos" on public.payments for select using (client_id = auth.uid() or public.is_admin());

-- triagem (árvore)
create policy "árvore visível" on public.triage_questions for select to authenticated using (true);
create policy "admin gerencia perguntas" on public.triage_questions for all using (public.is_admin()) with check (public.is_admin());
create policy "opções visíveis" on public.triage_options for select to authenticated using (true);
create policy "admin gerencia opções" on public.triage_options for all using (public.is_admin()) with check (public.is_admin());

-- triagens respondidas
create policy "minhas triagens" on public.triages for select using (client_id = auth.uid());
create policy "psicólogo vê triagem do atendimento" on public.triages for select using (
  exists (select 1 from public.appointments a where a.triage_id = triages.id and a.psychologist_id = auth.uid())
);
create policy "admin vê triagens" on public.triages for select using (public.is_admin());
create policy "admin revisa triagens" on public.triages for update using (public.is_admin()) with check (public.is_admin());

-- disponibilidade
create policy "disponibilidade visível" on public.availability_rules for select to authenticated using (true);
create policy "psicólogo gerencia a própria" on public.availability_rules for all
  using (psychologist_id = auth.uid()) with check (psychologist_id = auth.uid());
create policy "admin gerencia disponibilidade" on public.availability_rules for all using (public.is_admin()) with check (public.is_admin());

-- atendimentos: escrita via funções
create policy "meus atendimentos (cliente)" on public.appointments for select using (client_id = auth.uid());
create policy "meus atendimentos (psicólogo)" on public.appointments for select using (psychologist_id = auth.uid());
create policy "admin vê atendimentos" on public.appointments for select using (public.is_admin());

-- configurações
create policy "configurações visíveis" on public.settings for select to authenticated using (true);
create policy "admin edita configurações" on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- Funções chamáveis pelo app
revoke execute on function public.available_slots(uuid, uuid) from public, anon;
revoke execute on function public.submit_triage(uuid, uuid[]) from public, anon;
revoke execute on function public.book_appointment(uuid, timestamptz, uuid) from public, anon;
revoke execute on function public.cancel_appointment(uuid, text) from public, anon;
revoke execute on function public.set_appointment_outcome(uuid, public.appointment_status) from public, anon;
grant execute on function public.available_slots(uuid, uuid) to authenticated;
grant execute on function public.submit_triage(uuid, uuid[]) to authenticated;
grant execute on function public.book_appointment(uuid, timestamptz, uuid) to authenticated;
grant execute on function public.cancel_appointment(uuid, text) to authenticated;
grant execute on function public.set_appointment_outcome(uuid, public.appointment_status) to authenticated;
