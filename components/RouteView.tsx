"use client";

import { useMemo, useRef, useState } from "react";
import type { MallData, Place } from "@/lib/types";
import { buildRoute, formatMeters, formatMinutes, formatStep } from "@/lib/directions";
import { getGraph } from "@/lib/routing";
import FloorMap from "./FloorMap";
import LevelTabs from "./LevelTabs";

type Props = {
  mall: MallData;
  place: Place;
  startNodeId: string;
  onStartChange: (nodeId: string) => void;
  onBack: () => void;
};

export default function RouteView({ mall, place, startNodeId, onStartChange, onBack }: Props) {
  const route = useMemo(
    () => buildRoute(mall, startNodeId, place.nodeId),
    [mall, startNodeId, place.nodeId],
  );
  const startLevel = getGraph(mall).nodes.get(startNodeId)!.level;
  // Parent remounts this view (via key) when start/destination change, so this resets.
  const [level, setLevel] = useState(startLevel);
  const mapRef = useRef<HTMLDivElement>(null);

  const routeLevels = useMemo(() => {
    const nodes = getGraph(mall).nodes;
    return new Set(route?.nodeIds.map((id) => nodes.get(id)!.level));
  }, [mall, route]);

  const levelName = (n: number) =>
    mall.mall.levels.find((l) => l.number === n)?.name ?? `Level ${n}`;

  const scannedIsEntrance = mall.entrances.some((e) => e.nodeId === startNodeId);

  const showStepOnMap = (stepLevel: number) => {
    setLevel(stepLevel);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="pb-10">
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="-ms-2 flex h-11 items-center gap-1 rounded-lg px-2 text-base font-medium text-emerald-700 active:bg-emerald-50"
        >
          <span aria-hidden>←</span> Back to search
        </button>

        <h2 className="mt-1 text-2xl font-bold">{place.name}</h2>
        <p className="text-neutral-600">{levelName(place.level)}</p>

        {route && (
          <p className="mt-2 text-lg font-semibold">
            {formatMinutes(route.seconds)} walk · {formatMeters(route.meters)}
          </p>
        )}

        <label className="mt-3 block text-sm text-neutral-600" htmlFor="start-select">
          Starting from
        </label>
        <select
          id="start-select"
          value={startNodeId}
          onChange={(e) => onStartChange(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base"
        >
          {!scannedIsEntrance && <option value={startNodeId}>Where I scanned the QR code</option>}
          {mall.entrances.map((e) => (
            <option key={e.id} value={e.nodeId}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <div ref={mapRef} className="scroll-mt-2 px-4 pt-4">
        <LevelTabs levels={mall.mall.levels} current={level} onChange={setLevel} marked={routeLevels} />
        <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200">
          <FloorMap
            mall={mall}
            level={level}
            places={mall.places}
            selectedPlaceId={place.id}
            startNodeId={startNodeId}
            routeNodeIds={route?.nodeIds}
          />
        </div>
      </div>

      <div className="px-4 pt-5">
        {route ? (
          <>
            <h3 className="text-lg font-bold">Directions</h3>
            <ol className="mt-2 divide-y divide-neutral-200">
              {route.steps.map((step, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => showStepOnMap(step.level)}
                    className="flex min-h-14 w-full items-center gap-3 py-3 text-start active:bg-neutral-50"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-base">
                      {formatStep(step, { placeName: place.name, levelName })}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500">{levelName(step.level)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
            Sorry, we couldn’t find a walking route to {place.name}. Please ask Guest Services.
          </p>
        )}
      </div>
    </div>
  );
}
