import { DemoShell } from "../demo-shell";

const NAV = [
  { href: "/demo/psicologo", label: "Agenda" },
  { href: "/demo/psicologo/disponibilidade", label: "Disponibilidade" },
];

export default function DemoPsychologistLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoShell name="Ana Souza" roleLabel="Psicóloga · CRP 07/12345" nav={NAV}>
      {children}
    </DemoShell>
  );
}
