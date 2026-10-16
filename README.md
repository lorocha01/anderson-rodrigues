# AconselhA

Plataforma de aconselhamento psicológico breve e acessível. O cliente assina um plano, faz uma triagem guiada, é direcionado ao grupo de psicólogos do tema escolhido e agenda um atendimento online (Google Meet).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, RLS) · Vercel.

## Perfis

| Perfil | Rota | O que faz |
| --- | --- | --- |
| Cliente | `/cliente` | Compra plano (assinatura mensal ou avulso), faz a triagem, agenda (primeiro horário livre ou escolhendo o profissional), entra na chamada, cancela |
| Psicólogo | `/psicologo` | Agenda com o resumo da triagem, registra realizado/falta, cadastra disponibilidade semanal e o link fixo do Meet |
| Admin | `/admin` | Painel, cadastro e habilitação de psicólogos, categorias, editor da árvore de triagem, planos, alertas de risco, relatórios de atendimentos (repasse), regras de cancelamento |

## Fluxo do cliente

1. **Pergunta de segurança**: feita a todos no início. Uma resposta de risco imediato mostra CVV 188 e SAMU 192 na hora. Respostas de risco geram um alerta no painel admin.
2. **Tema**: família, trabalho, relacionamentos, emoções…
3. **Perguntas do tema**: árvore editável no admin. Cada resposta leva a outra pergunta ou ao fim.
4. **Agendamento**: horários livres dos psicólogos daquele tema. Se o cliente não escolher o profissional, o sistema distribui para quem estiver livre, com menos atendimentos na semana.
5. **Atendimento**: link fixo do Meet do psicólogo. Ao final, o psicólogo registra se o atendimento foi realizado ou se o cliente faltou.

**Créditos:** cada atendimento consome 1 crédito do plano vigente (o plano "Livre" é ilimitado no ciclo). Cancelar dentro do prazo configurado (padrão de 24h) devolve o crédito. Quando o cancelamento é do psicólogo ou do admin, o crédito sempre volta.

## Pagamentos

Por enquanto em **modo simulado** (`PAYMENTS_MODE=mock`): o botão de pagamento aprova na hora e ativa o plano. A integração com o gateway (Asaas, Mercado Pago etc.) entra em `purchasePlan` (`src/app/cliente/actions.ts`) e num webhook que ativa a assinatura.

## Configuração

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Aplique o schema e os dados iniciais. Use o **SQL Editor**, rodando em ordem `supabase/migrations/20261016000000_init.sql` e `supabase/seed.sql`, ou a CLI:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   psql "<connection string>" -f supabase/seed.sql
   ```
3. Em **Authentication → URL Configuration**, defina o *Site URL* (ex.: `https://aconselha.vercel.app`) e adicione `https://<seu-dominio>/auth/confirm` às *Redirect URLs*.
4. Os templates de e-mail padrão funcionam: a rota `/auth/confirm` aceita tanto `?code=` (padrão do Supabase) quanto `?token_hash=&type=`.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha (em produção, nas variáveis da Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # só no servidor
NEXT_PUBLIC_SITE_URL=
PAYMENTS_MODE=mock
```

### 3. Primeiro admin

Cadastre-se normalmente pelo site e promova a conta no SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'anderson@exemplo.com');
```

Os psicólogos são cadastrados pelo admin em **Admin → Psicólogos**, com e-mail e senha provisória.

### 4. Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

Para desenvolver com o Supabase local: `npx supabase start` (precisa de Docker), depois `npx supabase db reset`, que aplica a migration e o seed.

## Segurança e LGPD

- **RLS** em todas as tabelas: cada cliente só vê os próprios dados; o psicólogo só vê os clientes e as triagens dos seus atendimentos.
- Operações sensíveis (triagem, agendamento, cancelamento, resultado) passam por funções `security definer` no banco, que validam papel, saldo e disponibilidade.
- O papel do usuário nunca vem do cadastro: todo novo usuário é cliente, e só o admin ou o servidor promove.
- O link do Meet não fica exposto no diretório de psicólogos; ele é copiado para o atendimento no momento do agendamento.
- O consentimento LGPD é registrado em `profiles.consent_at`.

## Estrutura

```
src/app/            rotas (cliente, psicologo, admin, auth)
src/components/     UI compartilhada
src/lib/            supabase, auth, tipos, formatação
supabase/           migrations e seed
```

## Próximos passos sugeridos

- Integração de pagamento (assinatura recorrente + PIX) e webhook
- Lembretes por e-mail/WhatsApp antes do atendimento
- Bloqueio de datas (férias e feriados) na agenda do psicólogo
- Geração automática do link do Meet via Google Calendar
- App mobile (PWA instalável ou React Native)
