import type { MallData, MallNode, NodeType } from "./types";
import { getGraph, shortestPath, type Graph } from "./routing";

export const WALK_SPEED_MPS = 1.2;

/** Turns sharper than this count as a turn; below it you keep going straight. */
const STRAIGHT_DEG = 30;
const SLIGHT_DEG = 60;
const U_TURN_DEG = 150;
/** After a level change, a first walk this short (stepping off) is folded into the next step. */
const STUB_METERS = 15;
/** A final turn this short is the step into the store/connector ("on your left", "turn right to the elevator"). */
export const DOOR_METERS = 25;

export type Turn = "left" | "right" | "slight-left" | "slight-right" | "u-turn";
export type Connector = Extract<NodeType, "escalator" | "elevator" | "stairs">;

export type Step =
  | {
      kind: "walk";
      level: number;
      meters: number;
      /** Turn to make before walking; null = continue ahead. */
      turn: Turn | null;
      /** Set when this walk ends at the connector used by the next step. */
      toward?: Connector;
    }
  | {
      kind: "change-level";
      level: number; // level you arrive on
      fromLevel: number;
      connector: Connector;
      meters: number;
    }
  | {
      kind: "arrive";
      level: number;
      side: "left" | "right" | "ahead" | "here";
    };

export type Route = {
  nodeIds: string[];
  meters: number;
  seconds: number;
  steps: Step[];
};

const CONNECTORS = new Set<NodeType>(["escalator", "elevator", "stairs"]);

function edgeMeters(graph: Graph, from: string, to: string): number {
  return graph.adjacency.get(from)!.find((n) => n.to === to)!.meters;
}

/** Turn made at `cur` when walking prev → cur → next (SVG coords: y points down). */
function turnAt(prev: MallNode, cur: MallNode, next: MallNode): Turn | null {
  const ax = cur.x - prev.x, ay = cur.y - prev.y;
  const bx = next.x - cur.x, by = next.y - cur.y;
  const deg = (Math.atan2(ax * by - ay * bx, ax * bx + ay * by) * 180) / Math.PI;
  const abs = Math.abs(deg);
  if (abs < STRAIGHT_DEG) return null;
  if (abs > U_TURN_DEG) return "u-turn";
  const side = deg > 0 ? "right" : "left";
  return abs < SLIGHT_DEG ? (`slight-${side}` as Turn) : side;
}

export function buildRoute(
  mall: MallData,
  startNodeId: string,
  goalNodeId: string,
): Route | null {
  const graph = getGraph(mall);
  const path = shortestPath(graph, startNodeId, goalNodeId);
  if (!path) return null;

  const nodes = path.nodeIds.map((id) => graph.nodes.get(id)!);
  const steps: Step[] = [];

  if (nodes.length === 1) {
    steps.push({ kind: "arrive", level: nodes[0].level, side: "here" });
  }

  let i = 0;
  while (i < nodes.length - 1) {
    // Level change: one or more consecutive edges between levels.
    if (nodes[i].level !== nodes[i + 1].level) {
      const from = nodes[i];
      let meters = 0;
      while (i < nodes.length - 1 && nodes[i].level !== nodes[i + 1].level) {
        meters += edgeMeters(graph, nodes[i].id, nodes[i + 1].id);
        i++;
      }
      steps.push({
        kind: "change-level",
        level: nodes[i].level,
        fromLevel: from.level,
        connector: (CONNECTORS.has(from.type) ? from.type : nodes[i].type) as Connector,
        meters,
      });
      continue;
    }

    // Walking leg: consecutive nodes on the same level, split at each turn.
    let k = i;
    while (k < nodes.length - 1 && nodes[k + 1].level === nodes[i].level) k++;
    const leg = nodes.slice(i, k + 1);
    const segs: { turn: Turn | null; meters: number }[] = [{ turn: null, meters: 0 }];
    for (let j = 1; j < leg.length; j++) {
      segs[segs.length - 1].meters += edgeMeters(graph, leg[j - 1].id, leg[j].id);
      if (j < leg.length - 1) {
        const turn = turnAt(leg[j - 1], leg[j], leg[j + 1]);
        if (turn) segs.push({ turn, meters: 0 });
      }
    }
    if (i > 0 && segs.length > 1 && segs[0].meters <= STUB_METERS) {
      segs[1].meters += segs[0].meters;
      segs.shift();
    }

    const level = leg[0].level;
    const endsRoute = k === nodes.length - 1;
    let side: "left" | "right" | "ahead" = "ahead";
    const last = segs[segs.length - 1];
    if (endsRoute && segs.length > 1 && last.turn && last.meters <= DOOR_METERS) {
      segs.pop();
      side = last.turn.includes("left") ? "left" : last.turn.includes("right") ? "right" : "ahead";
    }

    segs.forEach((s, idx) => {
      const toward =
        !endsRoute && idx === segs.length - 1 && CONNECTORS.has(leg[leg.length - 1].type)
          ? (leg[leg.length - 1].type as Connector)
          : undefined;
      steps.push({ kind: "walk", level, meters: s.meters, turn: s.turn, ...(toward && { toward }) });
    });
    if (endsRoute) steps.push({ kind: "arrive", level, side });
    i = k;
  }

  return {
    nodeIds: path.nodeIds,
    meters: path.meters,
    seconds: path.meters / WALK_SPEED_MPS,
    steps,
  };
}

// ---- English formatting (moves to i18n in phase 6) ----

const TURN_TEXT: Record<Turn, string> = {
  left: "Turn left",
  right: "Turn right",
  "slight-left": "Bear left",
  "slight-right": "Bear right",
  "u-turn": "Turn around",
};

export function formatMeters(meters: number): string {
  return `${Math.round(meters)} m`;
}

export function formatMinutes(seconds: number): string {
  const min = Math.round(seconds / 60);
  return min < 1 ? "<1 min" : `${min} min`;
}

export function formatStep(
  step: Step,
  ctx: { placeName: string; levelName: (n: number) => string },
): string {
  switch (step.kind) {
    case "walk": {
      const dist = formatMeters(step.meters);
      if (step.toward && step.turn && step.meters <= DOOR_METERS) {
        return `${TURN_TEXT[step.turn]} to the ${step.toward}`;
      }
      const walk = step.toward ? `walk ${dist} to the ${step.toward}` : `walk ${dist}`;
      return step.turn ? `${TURN_TEXT[step.turn]} and ${walk}` : walk[0].toUpperCase() + walk.slice(1);
    }
    case "change-level": {
      const dir = step.level > step.fromLevel ? "up" : "down";
      return `Take the ${step.connector} ${dir} to ${ctx.levelName(step.level)}`;
    }
    case "arrive":
      if (step.side === "here") return `You're already at ${ctx.placeName}`;
      if (step.side === "ahead") return `Arrive at ${ctx.placeName}`;
      return `${ctx.placeName} is on your ${step.side}`;
  }
}
