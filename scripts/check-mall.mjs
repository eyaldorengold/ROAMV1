// Sanity-checks a hand-edited mall JSON. Usage: npm run check-mall -- sample-mall
import fs from "node:fs";
import path from "node:path";

const mallId = process.argv[2] ?? "sample-mall";
const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "data/malls", `${mallId}.json`);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const CONNECTORS = new Set(["escalator", "elevator", "stairs"]);
const NODE_TYPES = new Set(["corridor", "entrance", "store_door", ...CONNECTORS]);

const nodes = new Map();
for (const n of data.nodes) {
  if (nodes.has(n.id)) errors.push(`Duplicate node id "${n.id}"`);
  if (!NODE_TYPES.has(n.type)) errors.push(`Node "${n.id}" has unknown type "${n.type}"`);
  if (!data.mall.levels.some((l) => l.number === n.level)) errors.push(`Node "${n.id}" is on unknown level ${n.level}`);
  nodes.set(n.id, n);
}

const adjacency = new Map([...nodes.keys()].map((id) => [id, []]));
for (const e of data.edges) {
  const a = nodes.get(e.from), b = nodes.get(e.to);
  if (!a || !b) { errors.push(`Edge ${e.from} → ${e.to} points to a missing node`); continue; }
  if (!(e.distanceMeters > 0)) errors.push(`Edge ${e.from} → ${e.to} needs a positive distanceMeters`);
  if (a.level !== b.level && !(CONNECTORS.has(a.type) && CONNECTORS.has(b.type)))
    errors.push(`Edge ${e.from} → ${e.to} crosses levels but isn't escalator/elevator/stairs`);
  adjacency.get(a.id).push(b.id);
  adjacency.get(b.id).push(a.id);
}

const placeIds = new Set();
for (const p of data.places) {
  if (placeIds.has(p.id)) errors.push(`Duplicate place id "${p.id}"`);
  placeIds.add(p.id);
  const n = nodes.get(p.nodeId);
  if (!n) errors.push(`Place "${p.name}" uses missing node "${p.nodeId}"`);
  else if (n.level !== p.level) errors.push(`Place "${p.name}" is level ${p.level} but its node is on level ${n.level}`);
}
for (const e of data.entrances) {
  if (!nodes.has(e.nodeId)) errors.push(`Entrance "${e.name}" uses missing node "${e.nodeId}"`);
}

// Every node must be reachable from the first entrance.
const start = data.entrances[0]?.nodeId;
if (start && nodes.has(start)) {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) for (const next of adjacency.get(queue.shift())) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  for (const id of nodes.keys()) if (!seen.has(id)) errors.push(`Node "${id}" can't be reached from ${data.entrances[0].name}`);
}

for (const l of data.mall.levels) {
  const svg = path.join(root, "public/malls", mallId, `level-${l.number}.svg`);
  if (!fs.existsSync(svg)) errors.push(`Missing floor plan ${path.relative(root, svg)}`);
}

if (errors.length) {
  console.error(`✗ ${mallId}: ${errors.length} problem(s)\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ ${mallId}: ${data.places.length} places, ${nodes.size} nodes, ${data.edges.length} edges — all good`);
