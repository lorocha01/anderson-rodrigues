import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo className="text-3xl" />
      <h1 className="font-display text-2xl font-semibold">Página não encontrada</h1>
      <ButtonLink href="/">Voltar ao início</ButtonLink>
    </div>
  );
}
