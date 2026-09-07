import type { TranslationKey } from '@/i18n';
import type { PracticeMode } from '@/features/practice/useRound';

/**
 * The ways of practising, in order of weight, each with the reason it exists.
 *
 * The order is the argument. Pointing asks where something is and is where a
 * child meets a set for the first time. Multiple choice narrows the field to
 * four and is the step up to typing rather than a way around it. Typing asks
 * for the name unaided, which is what a test will ask. Exploring asks nothing
 * at all.
 *
 * That last distinction is why the challenge modes are not in this list. A
 * lightning round and a survival round add a clock and lives to something a
 * child already knows; they are not a way to learn it, and putting them beside
 * these four would say they were.
 *
 * `built` is what ADR-037 does everywhere else: a way that does not exist is
 * not offered. All four exist now — multiple choice arrived with step 7b — so
 * the flag currently lets nothing through. It stays because the next way to be
 * drawn before it is built will need it, and because its arriving was a flag
 * flip rather than a rearrangement, which is what it was for.
 */
export interface Way {
  /** Exploring is not a way of answering, so it is not a `PracticeMode`. */
  readonly id: PracticeMode | 'ontdekken';
  readonly name: TranslationKey;
  /** One line saying what this is for, which is what makes the order legible. */
  readonly reason: TranslationKey;
  readonly built: boolean;
}

export const WAYS: readonly Way[] = [
  { id: 'wijs-aan', name: 'mode.wijs-aan', reason: 'way.wijs-aan', built: true },
  { id: 'meerkeuze', name: 'mode.meerkeuze', reason: 'way.meerkeuze', built: true },
  { id: 'hoe-heet-dit', name: 'mode.hoe-heet-dit', reason: 'way.hoe-heet-dit', built: true },
  { id: 'ontdekken', name: 'mode.ontdekken', reason: 'way.ontdekken', built: true },
];

export const BUILT_WAYS = WAYS.filter((way) => way.built);
