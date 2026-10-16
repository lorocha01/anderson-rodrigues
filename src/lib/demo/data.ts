// Dados fictícios da demonstração (espelham supabase/seed.sql).
import type { Category, Plan, TriageOption, TriageQuestion } from "@/lib/types";

export const DEMO_CATEGORIES: Category[] = [
  { id: "c-familia", slug: "familia", name: "Família", description: "Conflitos familiares, relação com filhos, pais e irmãos.", icon: "🏡", active: true, sort_order: 1 },
  { id: "c-trabalho", slug: "trabalho", name: "Trabalho e carreira", description: "Estresse, esgotamento, desemprego e conflitos no trabalho.", icon: "💼", active: true, sort_order: 2 },
  { id: "c-relac", slug: "relacionamentos", name: "Relacionamentos", description: "Vida a dois, separação, solidão e amizades.", icon: "💞", active: true, sort_order: 3 },
  { id: "c-emocoes", slug: "emocoes", name: "Emoções e ansiedade", description: "Ansiedade, tristeza, luto e autoestima.", icon: "🌱", active: true, sort_order: 4 },
];

export const DEMO_PLANS: Plan[] = [
  { id: "p-essencial", name: "Essencial", description: "1 atendimento por mês", kind: "subscription", sessions_included: 1, price_cents: 4990, duration_days: 30, highlighted: false, active: true, sort_order: 1 },
  { id: "p-cuidado", name: "Cuidado", description: "2 atendimentos por mês", kind: "subscription", sessions_included: 2, price_cents: 8990, duration_days: 30, highlighted: true, active: true, sort_order: 2 },
  { id: "p-livre", name: "Livre", description: "Atendimentos livres no mês (1 agendamento por vez)", kind: "subscription", sessions_included: null, price_cents: 14990, duration_days: 30, highlighted: false, active: true, sort_order: 3 },
  { id: "p-avulso", name: "Avulso", description: "1 atendimento, válido por 60 dias", kind: "package", sessions_included: 1, price_cents: 6990, duration_days: 60, highlighted: false, active: true, sort_order: 4 },
];

// Árvore de triagem ----------------------------------------------------------
type Q = [id: string, categoryId: string | null, text: string, isRoot: boolean, help?: string];
type O = [questionId: string, label: string, next: string | null, risk?: 0 | 1 | 2];

const QUESTIONS: Q[] = [
  ["q-risco", null, "Antes de começar: como você está em relação à sua segurança neste momento?", false, "Sua resposta é confidencial e nos ajuda a cuidar melhor de você."],
  ["q-fam-1", "c-familia", "Com quem é a situação que mais te preocupa?", true],
  ["q-fam-2", "c-familia", "Há quanto tempo isso está acontecendo?", false],
  ["q-fam-3", "c-familia", "Existe alguma situação de violência ou ameaça em casa?", false],
  ["q-trab-1", "c-trabalho", "O que melhor descreve o seu momento?", true],
  ["q-trab-2", "c-trabalho", "Isso está afetando seu sono, apetite ou saúde?", false],
  ["q-rel-1", "c-relac", "Sobre qual relação você quer conversar?", true],
  ["q-rel-2", "c-relac", "Você se sente seguro(a) nessa relação?", false],
  ["q-rel-3", "c-relac", "O que você mais gostaria de trabalhar?", false],
  ["q-emo-1", "c-emocoes", "O que você tem sentido com mais frequência?", true],
  ["q-emo-2", "c-emocoes", "Com que frequência isso acontece?", false],
  ["q-emo-3", "c-emocoes", "Você já fez algum acompanhamento psicológico antes?", false],
];

const OPTIONS: O[] = [
  ["q-risco", "Estou em segurança", null, 0],
  ["q-risco", "Às vezes penso em me machucar ou em sumir", null, 1],
  ["q-risco", "Estou pensando em tirar minha vida agora", null, 2],
  ["q-fam-1", "Filhos", "q-fam-2"], ["q-fam-1", "Pais", "q-fam-2"], ["q-fam-1", "Irmãos ou outros parentes", "q-fam-2"], ["q-fam-1", "Família toda", "q-fam-2"],
  ["q-fam-2", "Começou agora (menos de um mês)", "q-fam-3"], ["q-fam-2", "Alguns meses", "q-fam-3"], ["q-fam-2", "Mais de um ano", "q-fam-3"],
  ["q-fam-3", "Não", null, 0], ["q-fam-3", "Já aconteceu, mas não agora", null, 1], ["q-fam-3", "Sim, estou em risco", null, 2],
  ["q-trab-1", "Estou sobrecarregado(a) ou esgotado(a)", "q-trab-2"], ["q-trab-1", "Conflito com chefia ou colegas", "q-trab-2"],
  ["q-trab-1", "Estou desempregado(a) ou com medo de perder o emprego", "q-trab-2"], ["q-trab-1", "Dúvidas sobre carreira e mudanças", "q-trab-2"],
  ["q-trab-2", "Não", null], ["q-trab-2", "Um pouco", null], ["q-trab-2", "Muito", null],
  ["q-rel-1", "Namoro ou casamento", "q-rel-2"], ["q-rel-1", "Separação ou término", "q-rel-3"],
  ["q-rel-1", "Solidão ou dificuldade de me relacionar", "q-rel-3"], ["q-rel-1", "Amizades", "q-rel-3"],
  ["q-rel-2", "Sim", "q-rel-3", 0], ["q-rel-2", "Nem sempre", "q-rel-3", 1], ["q-rel-2", "Não, tenho medo da outra pessoa", "q-rel-3", 2],
  ["q-rel-3", "Comunicação", null], ["q-rel-3", "Ciúmes e confiança", null], ["q-rel-3", "Seguir em frente", null], ["q-rel-3", "Ainda não sei", null],
  ["q-emo-1", "Ansiedade ou preocupação constante", "q-emo-2"], ["q-emo-1", "Tristeza ou desânimo", "q-emo-2"],
  ["q-emo-1", "Luto ou perda recente", "q-emo-2"], ["q-emo-1", "Baixa autoestima ou insegurança", "q-emo-2"],
  ["q-emo-2", "De vez em quando", "q-emo-3"], ["q-emo-2", "Quase todos os dias", "q-emo-3"], ["q-emo-2", "O tempo todo", "q-emo-3"],
  ["q-emo-3", "Sim", null], ["q-emo-3", "Não, é a primeira vez", null],
];

export const DEMO_QUESTIONS: TriageQuestion[] = QUESTIONS.map(([id, category_id, text, is_root, help], i) => ({
  id, category_id, text, is_root, help_text: help ?? "", sort_order: i,
}));

export const DEMO_OPTIONS: TriageOption[] = OPTIONS.map(([question_id, label, next, risk], i) => ({
  id: `o-${i}`, question_id, label, next_question_id: next, risk_level: risk ?? 0, sort_order: i,
}));

// Psicólogos -----------------------------------------------------------------
export interface DemoPsychologist {
  id: string;
  display_name: string;
  crp: string;
  approach: string;
  bio: string;
  categories: string[];
  /** [dia da semana, início, fim] no horário de Brasília. */
  rules: [number, string, string][];
}

const WEEKDAYS_MORNING_AFTERNOON = [1, 2, 3, 4, 5].flatMap((d) => [[d, "08:00", "12:00"], [d, "14:00", "18:00"]] as [number, string, string][]);

export const DEMO_PSYCHOLOGISTS: DemoPsychologist[] = [
  {
    id: "psi-ana", display_name: "Ana Souza", crp: "07/12345", approach: "Terapia Cognitivo-Comportamental",
    bio: "Psicóloga clínica há 10 anos, com foco em ansiedade e relações familiares.",
    categories: ["c-familia", "c-emocoes", "c-trabalho", "c-relac"],
    rules: [...WEEKDAYS_MORNING_AFTERNOON, [6, "09:00", "12:00"]],
  },
  {
    id: "psi-bruno", display_name: "Bruno Martins", crp: "07/23456", approach: "Psicanálise",
    bio: "Atende adultos em questões de carreira, esgotamento e relacionamentos.",
    categories: ["c-trabalho", "c-relac"],
    rules: [1, 3, 5].map((d) => [d, "18:00", "21:00"] as [number, string, string]),
  },
  {
    id: "psi-carla", display_name: "Carla Nunes", crp: "07/34567", approach: "Abordagem Humanista",
    bio: "Escuta acolhedora para luto, autoestima e momentos de transição.",
    categories: ["c-emocoes", "c-relac", "c-familia"],
    rules: [2, 4].flatMap((d) => [[d, "09:00", "12:00"], [d, "18:00", "21:00"]] as [number, string, string][]),
  },
  {
    id: "psi-diego", display_name: "Diego Ramos", crp: "07/45678", approach: "Terapia Sistêmica",
    bio: "Especialista em dinâmicas familiares e de casal.",
    categories: ["c-familia", "c-relac"],
    rules: [[6, "08:00", "13:00"], [3, "13:00", "17:00"]],
  },
];

/** A demonstração mostra a área do psicólogo como se fosse a Ana. */
export const DEMO_LOGGED_PSYCHOLOGIST = "psi-ana";

export const DEMO_SETTINGS = { session_minutes: 50, cancel_window_hours: 24, min_notice_hours: 2, booking_horizon_days: 14 };

// Clientes e atendimentos fictícios (área do psicólogo e do admin) ---------
export interface DemoSampleAppointment {
  id: string;
  clientName: string;
  psychologistId: string;
  categoryId: string;
  /** Dias a partir de hoje e horário (Brasília). */
  dayOffset: number;
  time: string;
  status: "scheduled" | "completed" | "no_show" | "canceled";
  riskLevel: 0 | 1 | 2;
  answers: { question: string; answer: string; risk_level: number }[];
}

export const DEMO_SAMPLE_APPOINTMENTS: DemoSampleAppointment[] = [
  {
    id: "s-1", clientName: "Mariana Alves", psychologistId: "psi-ana", categoryId: "c-familia", dayOffset: 1, time: "09:40", status: "scheduled", riskLevel: 0,
    answers: [
      { question: "Com quem é a situação que mais te preocupa?", answer: "Filhos", risk_level: 0 },
      { question: "Há quanto tempo isso está acontecendo?", answer: "Alguns meses", risk_level: 0 },
      { question: "Existe alguma situação de violência ou ameaça em casa?", answer: "Não", risk_level: 0 },
    ],
  },
  {
    id: "s-2", clientName: "Roberto Lima", psychologistId: "psi-ana", categoryId: "c-trabalho", dayOffset: 2, time: "14:00", status: "scheduled", riskLevel: 1,
    answers: [
      { question: "Antes de começar: como você está em relação à sua segurança neste momento?", answer: "Às vezes penso em me machucar ou em sumir", risk_level: 1 },
      { question: "O que melhor descreve o seu momento?", answer: "Estou sobrecarregado(a) ou esgotado(a)", risk_level: 0 },
      { question: "Isso está afetando seu sono, apetite ou saúde?", answer: "Muito", risk_level: 0 },
    ],
  },
  { id: "s-3", clientName: "Juliana Costa", psychologistId: "psi-carla", categoryId: "c-emocoes", dayOffset: 1, time: "10:40", status: "scheduled", riskLevel: 0, answers: [] },
  { id: "s-4", clientName: "Felipe Rocha", psychologistId: "psi-bruno", categoryId: "c-relac", dayOffset: 3, time: "18:00", status: "scheduled", riskLevel: 0, answers: [] },
  { id: "s-5", clientName: "Patrícia Gomes", psychologistId: "psi-ana", categoryId: "c-emocoes", dayOffset: -2, time: "08:00", status: "completed", riskLevel: 0, answers: [] },
  { id: "s-6", clientName: "Carlos Mendes", psychologistId: "psi-ana", categoryId: "c-trabalho", dayOffset: -3, time: "15:40", status: "no_show", riskLevel: 0, answers: [] },
  { id: "s-7", clientName: "Fernanda Dias", psychologistId: "psi-diego", categoryId: "c-familia", dayOffset: -1, time: "09:40", status: "completed", riskLevel: 0, answers: [] },
  { id: "s-8", clientName: "Tiago Barros", psychologistId: "psi-bruno", categoryId: "c-trabalho", dayOffset: -4, time: "19:40", status: "completed", riskLevel: 0, answers: [] },
];

export const DEMO_REPORT = [
  { id: "psi-ana", completed: 38, noShow: 3, canceled: 4 },
  { id: "psi-bruno", completed: 21, noShow: 1, canceled: 2 },
  { id: "psi-carla", completed: 27, noShow: 2, canceled: 1 },
  { id: "psi-diego", completed: 15, noShow: 0, canceled: 3 },
];
