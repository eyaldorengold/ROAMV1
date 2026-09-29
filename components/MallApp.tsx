"use client";

import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { MallData } from "@/lib/types";
import PlaceSearch from "./PlaceSearch";
import RouteView from "./RouteView";

/**
 * Screen state lives in the URL so the phone's back button works and routes
 * can be shared: ?from={nodeId} (QR start point) &to={placeId} (destination).
 */
export default function MallApp({ mall }: { mall: MallData }) {
  const params = useSearchParams();
  const openedFromList = useRef(false);

  const fromParam = params.get("from");
  const fromIsValid = !!fromParam && mall.nodes.some((n) => n.id === fromParam);
  const startNodeId = fromIsValid ? fromParam : mall.entrances[0].nodeId;
  const startEntrance = mall.entrances.find((e) => e.nodeId === startNodeId);
  const place = mall.places.find((p) => p.id === params.get("to"));

  const urlWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `?${qs}` : window.location.pathname;
  };

  const selectPlace = (placeId: string) => {
    openedFromList.current = true;
    window.history.pushState(null, "", urlWith({ to: placeId, from: startNodeId }));
    window.scrollTo(0, 0);
  };

  const back = () => {
    if (openedFromList.current) {
      openedFromList.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", urlWith({ to: null }));
    }
  };

  const changeStart = (nodeId: string) =>
    window.history.replaceState(null, "", urlWith({ from: nodeId }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="px-4 pt-5 pb-2">
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">ROAM</p>
        <h1 className="text-2xl font-bold">{mall.mall.name}</h1>
        {fromIsValid && (
          <p className="mt-1 text-sm text-neutral-600">
            You are at: <span className="font-medium">{startEntrance?.name ?? "the directory kiosk"}</span>
          </p>
        )}
      </header>

      {/* Search stays mounted (just hidden) so the query survives a trip to a route. */}
      <div hidden={!!place}>
        <PlaceSearch mall={mall} startNodeId={startNodeId} onSelect={selectPlace} />
      </div>
      {place && (
        <RouteView
          key={`${startNodeId}-${place.id}`}
          mall={mall}
          place={place}
          startNodeId={startNodeId}
          onStartChange={changeStart}
          onBack={back}
        />
      )}
    </main>
  );
}
