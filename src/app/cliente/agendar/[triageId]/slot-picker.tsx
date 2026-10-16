"use client";

import { useState } from "react";

export interface PickerDay {
  key: string;
  weekday: string;
  day: string;
  long: string;
  times: { iso: string; label: string }[];
}

/** Escolha do dia (chips roláveis) e do horário daquele dia. */
export function SlotPicker({ days }: { days: PickerDay[] }) {
  const [active, setActive] = useState(days[0]?.key);
  const [picked, setPicked] = useState<string | null>(null);
  const day = days.find((d) => d.key === active) ?? days[0];

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" role="tablist" aria-label="Dias disponíveis">
        {days.map((d) => {
          const selected = d.key === day.key;
          const hasPick = d.times.some((t) => t.iso === picked);
          return (
            <button
              key={d.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(d.key)}
              className={`relative flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2.5 transition ${
                selected ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary"
              }`}
            >
              <span className={`text-xs font-bold ${selected ? "text-white/80" : "text-muted"}`}>{d.weekday}</span>
              <span className="font-extrabold">{d.day}</span>
              {hasPick && !selected && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <p className="mb-3 mt-4 font-bold">{day.long}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {day.times.map((t) => (
          <label key={t.iso} className="cursor-pointer">
            <input
              type="radio"
              name="starts_at"
              value={t.iso}
              required={!picked}
              checked={picked === t.iso}
              onChange={() => setPicked(t.iso)}
              className="peer sr-only"
            />
            <span className="block rounded-full border border-line bg-white py-2 text-center font-bold transition hover:border-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
              {t.label}
            </span>
          </label>
        ))}
      </div>
      {/* Mantém o horário escolhido no envio mesmo se a pessoa trocar de dia. */}
      {picked && !day.times.some((t) => t.iso === picked) && <input type="hidden" name="starts_at" value={picked} />}
    </div>
  );
}
