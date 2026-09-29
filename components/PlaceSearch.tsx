"use client";

import { useMemo, useState } from "react";
import type { MallData, PlaceCategory } from "@/lib/types";
import { searchPlaces } from "@/lib/search";
import FloorMap from "./FloorMap";
import LevelTabs from "./LevelTabs";

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  shoes: "Shoes",
  fashion: "Fashion",
  electronics: "Electronics",
  beauty: "Beauty",
  food: "Food",
  health: "Health",
  restroom: "Restrooms",
  services: "Services",
  parking: "Parking",
  entertainment: "Entertainment",
  kids: "Kids",
  books: "Books",
};

type Props = {
  mall: MallData;
  startNodeId: string;
  onSelect: (placeId: string) => void;
};

export default function PlaceSearch({ mall, startNodeId, onSelect }: Props) {
  const { places } = mall;
  const { levels } = mall.mall;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [mapLevel, setMapLevel] = useState(
    () => mall.nodes.find((n) => n.id === startNodeId)?.level ?? levels[0].number,
  );

  // Only offer chips for categories this mall actually has.
  const categories = useMemo(
    () => [...new Set(places.map((p) => p.category))],
    [places],
  );

  const results = useMemo(() => {
    const matched = searchPlaces(places, query);
    return category ? matched.filter((p) => p.category === category) : matched;
  }, [places, query, category]);

  const levelName = (n: number) =>
    levels.find((l) => l.number === n)?.name ?? `Level ${n}`;

  return (
    <>
      <div className="sticky top-0 z-10 bg-white px-4 pt-2 pb-3 shadow-[0_1px_0_#e5e5e5]">
        <label htmlFor="place-search" className="sr-only">
          Search stores, food, restrooms
        </label>
        <input
          id="place-search"
          type="search"
          inputMode="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search stores, food, restrooms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 text-lg outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20"
        />
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p className="text-sm text-neutral-500" aria-live="polite">
          {results.length} {results.length === 1 ? "place" : "places"}
        </p>
        <div className="flex rounded-lg bg-neutral-100 p-1" role="group" aria-label="View">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`h-9 rounded-md px-4 text-sm font-medium ${
                view === v ? "bg-white shadow-sm" : "text-neutral-600"
              }`}
            >
              {v === "list" ? "List" : "Map"}
            </button>
          ))}
        </div>
      </div>

      {view === "map" ? (
        <div className="px-4 pt-2 pb-8">
          <LevelTabs
            levels={levels}
            current={mapLevel}
            onChange={setMapLevel}
            marked={new Set(results.map((p) => p.level))}
          />
          <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200">
            <FloorMap
              mall={mall}
              level={mapLevel}
              places={results}
              startNodeId={startNodeId}
              onPlaceClick={onSelect}
            />
          </div>
          <p className="mt-2 text-center text-sm text-neutral-500">Tap a store for directions</p>
        </div>
      ) : results.length === 0 ? (
        <p className="px-4 py-10 text-center text-neutral-500">
          No places match “{query}”. Try another word, like “shoes” or “coffee”.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 px-4 pb-8">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className="flex min-h-16 w-full items-center gap-3 py-3 text-start active:bg-neutral-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{p.name}</p>
                  <p className="text-sm text-neutral-500">
                    {CATEGORY_LABELS[p.category]}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                  {levelName(p.level)}
                </span>
                <span aria-hidden className="text-xl text-neutral-400 rtl:rotate-180">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-emerald-700 text-white"
          : "bg-neutral-100 text-neutral-800 active:bg-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}
