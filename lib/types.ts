// Shape of /data/malls/{mallId}.json — see CLAUDE.md "Data model".

export type LanguageCode = "en" | "es" | "he";

export type Level = {
  number: number;
  name: string;
};

export type PlaceCategory =
  | "shoes"
  | "fashion"
  | "electronics"
  | "beauty"
  | "food"
  | "health"
  | "restroom"
  | "services"
  | "parking"
  | "entertainment"
  | "kids"
  | "books";

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  level: number;
  /** Graph node where the place's entrance is. */
  nodeId: string;
  keywords: string[];
  sponsored: boolean;
  promo?: string;
};

export type NodeType =
  | "corridor"
  | "entrance"
  | "escalator"
  | "elevator"
  | "stairs"
  | "store_door";

export type MallNode = {
  id: string;
  level: number;
  /** Coordinates on that level's SVG floor plan. */
  x: number;
  y: number;
  type: NodeType;
};

/** Edges are walkable both ways. */
export type Edge = {
  from: string;
  to: string;
  distanceMeters: number;
};

export type Entrance = {
  id: string;
  name: string;
  nodeId: string;
};

export type MallData = {
  mall: {
    id: string;
    name: string;
    languages: LanguageCode[];
    /** Coordinate space shared by every level's SVG (its viewBox size). */
    mapSize: { width: number; height: number };
    levels: Level[];
  };
  places: Place[];
  nodes: MallNode[];
  edges: Edge[];
  entrances: Entrance[];
};
