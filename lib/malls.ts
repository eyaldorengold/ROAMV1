import type { MallData } from "./types";
import sampleMall from "@/data/malls/sample-mall.json";

// Static imports (rather than reading files at runtime) so every mall JSON is
// bundled and type-checked. To add a mall: drop its JSON in /data/malls and
// register it here.
const MALLS: Record<string, MallData> = {
  "sample-mall": sampleMall as MallData,
};

export const DEFAULT_MALL_ID = "sample-mall";

export function getMall(mallId: string): MallData | undefined {
  return Object.hasOwn(MALLS, mallId) ? MALLS[mallId] : undefined;
}
