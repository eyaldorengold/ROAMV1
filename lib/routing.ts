import type { MallData, MallNode } from "./types";

type Neighbor = { to: string; meters: number };

export type Graph = {
  nodes: Map<string, MallNode>;
  adjacency: Map<string, Neighbor[]>;
};

const graphCache = new WeakMap<MallData, Graph>();

/** Build (once per mall) a lookup of nodes and their walkable neighbors. */
export function getGraph(mall: MallData): Graph {
  const cached = graphCache.get(mall);
  if (cached) return cached;

  const nodes = new Map(mall.nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Neighbor[]>(
    mall.nodes.map((n) => [n.id, []]),
  );
  // Edges are walkable both ways.
  for (const e of mall.edges) {
    adjacency.get(e.from)?.push({ to: e.to, meters: e.distanceMeters });
    adjacency.get(e.to)?.push({ to: e.from, meters: e.distanceMeters });
  }

  const graph = { nodes, adjacency };
  graphCache.set(mall, graph);
  return graph;
}

/**
 * Dijkstra shortest path. Returns the node ids from start to goal (inclusive),
 * or null if the goal can't be reached. Multi-floor routes work because
 * escalator/elevator/stairs edges connect nodes on different levels.
 *
 * Uses a simple linear scan instead of a priority queue — fine for a mall
 * graph of a few thousand nodes.
 */
export function shortestPath(
  graph: Graph,
  startId: string,
  goalId: string,
): { nodeIds: string[]; meters: number } | null {
  if (!graph.nodes.has(startId) || !graph.nodes.has(goalId)) return null;

  const dist = new Map<string, number>([[startId, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();

  while (true) {
    let current: string | undefined;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!done.has(id) && d < best) {
        best = d;
        current = id;
      }
    }
    if (current === undefined) return null; // unreachable
    if (current === goalId) break;
    done.add(current);

    for (const { to, meters } of graph.adjacency.get(current) ?? []) {
      const candidate = best + meters;
      if (candidate < (dist.get(to) ?? Infinity)) {
        dist.set(to, candidate);
        prev.set(to, current);
      }
    }
  }

  const nodeIds = [goalId];
  while (nodeIds[0] !== startId) nodeIds.unshift(prev.get(nodeIds[0])!);
  return { nodeIds, meters: dist.get(goalId)! };
}
