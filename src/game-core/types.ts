/**
 * The domain types. This module is pure: no DOM, no framework, no storage.
 *
 * That purity is not tidiness for its own sake. When leaderboards arrive, scores
 * have to be validated on a server (ADR-003), and the only affordable way to do
 * that is for the server to import this exact code. An import of `react` or
 * `idb` here would end that quietly, so the boundary is enforced by an ESLint
 * rule rather than by good intentions.
 */

export type ItemType =
  | 'provincie'
  | 'hoofdstad'
  | 'stad'
  | 'water'
  | 'berg'
  | 'land'
  | 'zee'
  | 'eiland'
  | 'landschap'
  | 'bouwwerk';

export type Niveau = 1 | 2 | 3;

export interface Item {
  readonly id: string;
  readonly type: ItemType;
  readonly naam: string;
  /** Alternative spellings accepted as correct. */
  readonly aliassen: readonly string[];
  readonly regioSet: string;
  /** Reference into a file in content/geo. Absent for point-only items. */
  readonly geometrieRef?: string;
  /** Pre-projected [x, y] in the region set's 0–1000 view box. */
  readonly punt?: readonly [number, number];
  readonly niveau: Niveau;
  readonly leerdoelen: readonly string[];
  readonly weetje?: string;
  /**
   * Links to other items, keyed by the kind of link: `hoofdstadVan` on a
   * capital, and whatever the next content type needs. Deliberately open rather
   * than a fixed set of fields — a river runs through provinces, an island
   * belongs to one, and inventing a column per relationship is how a content
   * model becomes unusable by the people who write content.
   */
  readonly relaties?: Readonly<Record<string, string>>;
}

/** Leitner boxes, one through five. Box 5 means "known". */
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface ItemState {
  readonly itemId: string;
  readonly box: LeitnerBox;
  /** ISO 8601, or null when the item has never been answered. */
  readonly laatsteReview: string | null;
  readonly volgendeReview: string | null;
  readonly goedCount: number;
  readonly foutCount: number;
}

/**
 * The modes that exist. Sleepronde was dropped, not deferred: ADR-023.
 *
 * Wider than `PracticeMode`, and deliberately: exploring is not a way of
 * answering, but a session of it is still a session and the store records it.
 */
export type ModeId =
  | 'wijs-aan'
  | 'meerkeuze'
  | 'hoe-heet-dit'
  | 'bliksemronde'
  | 'overleven'
  | 'ontdekken'
  | 'som-typen'
  | 'som-meerkeuze';
