"use client";

import type { Level } from "@/lib/types";

type Props = {
  levels: Level[];
  current: number;
  onChange: (level: number) => void;
  /** Levels to mark with a dot (e.g. levels the route passes through). */
  marked?: Set<number>;
};

export default function LevelTabs({ levels, current, onChange, marked }: Props) {
  return (
    <div role="tablist" aria-label="Floor" className="flex gap-2">
      {levels.map((l) => {
        const active = l.number === current;
        return (
          <button
            key={l.number}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(l.number)}
            className={`relative h-11 flex-1 rounded-xl text-base font-semibold ${
              active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800 active:bg-neutral-200"
            }`}
          >
            {l.name}
            {marked?.has(l.number) && (
              <span
                aria-hidden
                className={`absolute top-2 end-3 size-2 rounded-full ${active ? "bg-blue-300" : "bg-blue-600"}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
