"use client";

import type { MallData, MallNode, Place } from "@/lib/types";
import { getGraph } from "@/lib/routing";

type Props = {
  mall: MallData;
  level: number;
  /** Places to show as tappable labels on this level. */
  places: Place[];
  selectedPlaceId?: string;
  startNodeId?: string;
  /** Route to draw, as node ids from start to destination. */
  routeNodeIds?: string[];
  onPlaceClick?: (placeId: string) => void;
};

const LABEL_OFFSET = 80; // how far into the store unit (from its door) the label sits
const LABEL_LINE_CHARS = 12;

/** Split a name into short lines so it fits inside a store unit. */
function labelLines(name: string): string[] {
  const lines: string[] = [];
  for (const word of name.split(" ")) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + word).length <= LABEL_LINE_CHARS) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.slice(0, 3);
}

export default function FloorMap({
  mall,
  level,
  places,
  selectedPlaceId,
  startNodeId,
  routeNodeIds,
  onPlaceClick,
}: Props) {
  const graph = getGraph(mall);
  const { width, height } = mall.mall.mapSize;
  const node = (id: string) => graph.nodes.get(id)!;

  // Put each label inside the store: push it away from the walkway node its door connects to.
  const labelPos = (door: MallNode) => {
    const neighbor = graph.adjacency.get(door.id)?.map((n) => node(n.to)).find((n) => n.level === door.level);
    let dx = 0, dy = -1;
    if (neighbor) {
      const len = Math.hypot(door.x - neighbor.x, door.y - neighbor.y) || 1;
      // Store doors: label goes into the unit. Entrances (e.g. parking): label goes back inside the mall.
      const sign = door.type === "entrance" ? -1 : 1;
      dx = (sign * (door.x - neighbor.x)) / len;
      dy = (sign * (door.y - neighbor.y)) / len;
    }
    const pad = 80;
    return {
      x: Math.min(width - pad, Math.max(pad, door.x + dx * LABEL_OFFSET)),
      y: Math.min(height - pad, Math.max(pad, door.y + dy * LABEL_OFFSET)),
    };
  };

  // Route pieces on this level (consecutive runs), plus where it leaves/enters the level.
  const runs: MallNode[][] = [];
  const levelLinks: { node: MallNode; otherLevel: number; leaving: boolean }[] = [];
  if (routeNodeIds) {
    const path = routeNodeIds.map(node);
    path.forEach((n, i) => {
      if (n.level !== level) return;
      const prev = path[i - 1];
      if (prev?.level === level) runs[runs.length - 1].push(n);
      else runs.push([n]);
      const next = path[i + 1];
      if (next && next.level !== level) levelLinks.push({ node: n, otherLevel: next.level, leaving: true });
      if (prev && prev.level !== level) levelLinks.push({ node: n, otherLevel: prev.level, leaving: false });
    });
  }

  const start = startNodeId ? node(startNodeId) : undefined;
  const labelX = (x: number) => Math.min(width - 75, Math.max(75, x));
  const levelPlaces = places.filter((p) => p.level === level);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full select-none"
      role="img"
      aria-label={`Floor plan, level ${level}`}
    >
      <image href={`/malls/${mall.mall.id}/level-${level}.svg`} width={width} height={height} />

      {runs.map((run, i) => (
        <polyline
          key={i}
          points={run.map((n) => `${n.x},${n.y}`).join(" ")}
          fill="none"
          stroke="#2563eb"
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {levelPlaces.map((p) => {
        const door = node(p.nodeId);
        const pos = labelPos(door);
        const selected = p.id === selectedPlaceId;
        const lines = labelLines(p.name);
        return (
          <g
            key={p.id}
            onClick={onPlaceClick && (() => onPlaceClick(p.id))}
            className={onPlaceClick ? "cursor-pointer" : undefined}
            role={onPlaceClick ? "button" : undefined}
            aria-label={onPlaceClick ? `Directions to ${p.name}` : undefined}
          >
            {/* Invisible hit area the size of the store unit — big tap target. */}
            <rect x={pos.x - 75} y={pos.y - 42} width={150} height={84} fill="transparent" />
            <circle cx={door.x} cy={door.y} r={selected ? 14 : 8} fill={selected ? "#dc2626" : "#57534e"} stroke="#fff" strokeWidth={3} />
            <text
              x={pos.x}
              y={pos.y - ((lines.length - 1) * 22) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={20}
              fontWeight={selected ? 700 : 500}
              fill={selected ? "#b91c1c" : "#292524"}
            >
              {lines.map((line, i) => (
                <tspan key={i} x={pos.x} dy={i === 0 ? 0 : 22}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      {levelLinks.map(({ node: n, otherLevel, leaving }) => (
        <g key={`${n.id}-${leaving}`} transform={`translate(${n.x + 22}, ${n.y})`}>
          <rect x={0} y={-18} width={112} height={36} rx={18} fill="#1e3a8a" />
          <text x={56} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={18} fontWeight={700} fill="#fff">
            {leaving ? `${otherLevel > level ? "↑" : "↓"} Level ${otherLevel}` : `From L${otherLevel}`}
          </text>
        </g>
      ))}

      {start && start.level === level && (
        <g>
          <circle cx={start.x} cy={start.y} r={16} fill="#2563eb" stroke="#fff" strokeWidth={5} />
          {/* Label below the dot, or above it near the bottom edge. */}
          <rect x={labelX(start.x) - 70} y={start.y + (start.y < height - 80 ? 22 : -54)} width={140} height={32} rx={16} fill="#2563eb" />
          <text x={labelX(start.x)} y={start.y + (start.y < height - 80 ? 39 : -37)} textAnchor="middle" dominantBaseline="middle" fontSize={17} fontWeight={700} fill="#fff">
            You are here
          </text>
        </g>
      )}
    </svg>
  );
}
