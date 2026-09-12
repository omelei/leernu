/**
 * Loading map geometry.
 *
 * Fetched at runtime from /geo, never imported. Spec section 8 caps the app
 * shell at 300 kB and geodata is an order of magnitude larger than everything
 * else in the product: bundling it would mean a child waits for the whole of
 * the Netherlands before seeing a start screen, on a school network shared by
 * thirty of them.
 *
 * Written to `public/geo/` by tools/content/build-geo.mjs. Source and licence:
 * docs/DATA_SOURCES.md.
 */

export type Detailniveau = 'overview' | 'region' | 'detail';

export interface Vorm {
  readonly id: string;
  /** The name as the source spells it — not necessarily what a child is shown. */
  readonly bronnaam: string;
  readonly code: string | null;
  /** SVG path data in view-box coordinates. */
  readonly d: string;
  /** Where a label sits, or null when the source had no label point. */
  readonly punt: readonly [number, number] | null;
  /** [minX, minY, maxX, maxY]. Drives reading order and touch-target sizing. */
  readonly bbox: readonly [number, number, number, number];
  /**
   * The surface in square view-box units, outer rings less holes. Written for
   * the provinces (stap 10, S27): the hit zone is the diameter of a circle
   * with this surface. Layers built without it fall back to the box.
   */
  readonly oppervlak?: number;
}

export interface GeoSet {
  readonly regioSet: string;
  readonly onderwerp: string;
  readonly detailniveau: Detailniveau;
  readonly viewBox: readonly [number, number, number, number];
  readonly projectie: { readonly type: string; readonly centrum: { lat: number; lon: number } };
  readonly bron: {
    readonly naam: string | null;
    readonly licentie: string | null;
    readonly opgehaald: string | null;
  };
  readonly vormen: readonly Vorm[];
}

/** A city: a point rather than a shape, and too small to hit without help. */
export interface Punt {
  readonly id: string;
  readonly bronnaam: string;
  /**
   * The shape it sits in, when there is one. Null for water: the IJsselmeer
   * belongs to no province, which is the whole reason it is not drawn as land.
   */
  readonly provincie: string | null;
  readonly punt: readonly [number, number];
}

export interface PointSet {
  readonly regioSet: string;
  readonly onderwerp: string;
  readonly viewBox: readonly [number, number, number, number];
  readonly bron: {
    readonly naam: string | null;
    readonly licentie: string | null;
    readonly opgehaald: string | null;
  };
  readonly punten: readonly Punt[];
}

const cache = new Map<string, Promise<GeoSet>>();
const pointCache = new Map<string, Promise<PointSet>>();

/**
 * Vite's base path, always ending in a slash. Hard-coding a leading `/` works
 * on a domain of our own and breaks silently on any subpath — a blank map, and
 * the only clue a 404 in a console nobody in a classroom is reading.
 */
const BASE = import.meta.env.BASE_URL;

export function geoUrl(onderwerp: string, niveau: Detailniveau, regio = 'nl'): string {
  return `${BASE}geo/${regio}/${onderwerp}.${niveau}.json`;
}

export function pointUrl(onderwerp: string, regio = 'nl'): string {
  return `${BASE}geo/${regio}/${onderwerp}.json`;
}

/**
 * Loads one detail level, once. The cache holds the promise rather than the
 * result, so two components asking at the same time share a single request
 * instead of racing each other.
 */
export function loadGeoSet(onderwerp: string, niveau: Detailniveau, regio = 'nl'): Promise<GeoSet> {
  const url = geoUrl(onderwerp, niveau, regio);
  const existing = cache.get(url);
  if (existing) return existing;

  const request = fetch(url).then(async (response) => {
    if (!response.ok) {
      // Deliberately loud. A missing region set is a blank map in a classroom,
      // and a silent failure there is worse than a crash: the lesson continues
      // and nobody knows why nothing works.
      throw new Error(`Kaartbestand ${url} kon niet geladen worden (${response.status})`);
    }
    return (await response.json()) as GeoSet;
  });

  cache.set(url, request);
  return request;
}

/**
 * Loads a set of points — cities — projected into the same view box as the
 * shapes, so a dot and an outline line up exactly.
 */
export function loadPointSet(onderwerp: string, regio = 'nl'): Promise<PointSet> {
  const url = pointUrl(onderwerp, regio);
  const existing = pointCache.get(url);
  if (existing) return existing;

  const request = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Kaartbestand ${url} kon niet geladen worden (${response.status})`);
    }
    return (await response.json()) as PointSet;
  });

  pointCache.set(url, request);
  return request;
}

export function vormById(geo: GeoSet, id: string): Vorm | undefined {
  return geo.vormen.find((vorm) => vorm.id === id);
}

/** Test seam, and the way to force a reload after a content rebuild. */
export function clearGeoCache(): void {
  cache.clear();
  pointCache.clear();
}
