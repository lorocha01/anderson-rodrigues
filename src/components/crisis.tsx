/** Contatos de emergência. Sempre visíveis na área do cliente. */
export function CrisisFooter() {
  return (
    <footer className="border-t border-line bg-white/70">
      <div className="mx-auto max-w-5xl px-4 py-4 text-center text-sm text-muted">
        Se você estiver em crise ou pensando em tirar sua vida, não espere: ligue{" "}
        <a href="tel:188" className="font-bold text-primary">188 (CVV)</a>, 24h e gratuito, ou{" "}
        <a href="tel:192" className="font-bold text-primary">192 (SAMU)</a>.
      </div>
    </footer>
  );
}

export function CrisisPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-danger/30 bg-danger-soft p-6">
      <h2 className="font-display text-xl font-semibold text-danger">Você não está sozinho(a). Procure ajuda agora.</h2>
      <p className="mt-2">
        O que você está sentindo é importante e merece cuidado imediato. Neste momento, o melhor caminho é falar com
        quem pode te atender agora mesmo:
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a href="tel:188" className="rounded-2xl bg-white p-4 font-bold hover:ring-2 hover:ring-danger/30">
          <span className="block text-2xl text-danger">188</span>
          CVV: escuta 24h, gratuita e sigilosa
        </a>
        <a href="tel:192" className="rounded-2xl bg-white p-4 font-bold hover:ring-2 hover:ring-danger/30">
          <span className="block text-2xl text-danger">192</span>
          SAMU: emergência médica
        </a>
      </div>
      <p className="mt-4 text-sm">Se puder, chame alguém de confiança para ficar com você. Você também pode ir ao pronto-socorro ou ao CAPS mais próximo.</p>
      {children}
    </div>
  );
}
