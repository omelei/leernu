import type { ComponentType } from 'react';
import {
  BoltIcon,
  ChoiceIcon,
  ExploreIcon,
  KeyboardIcon,
  PointIcon,
  ShieldIcon,
  type IconProps,
} from '@/components/Icon';
import type { ModeId, RoundRule } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { ROUND_RULE } from '@/features/practice/useRound';
import { SUM_ROUND_RULE } from '@/features/sums/useSumRound';

/**
 * The ways of practising a module offers, in order of weight, each with a face.
 *
 * This replaces `round/modes.ts`, and it changes one thing that file was
 * explicit about: **the clock and the lives are in the list.** They used to be
 * chips beside it, on the argument that adding sixty seconds to something you
 * already know is not a way of learning it. That argument is still true, and it
 * is now made by the order and by the line under each name — which is where an
 * argument belongs, because a chip made it in a way that cost a child the thing
 * K2 exists for.
 *
 * What it cost: a chip started a round on the spot. So the two heaviest ways in
 * the product were the only two that skipped the sentence saying what was about
 * to happen, and a child who pressed one never read "Provincies aanwijzen · 15
 * vragen" at all. Now every way goes through the same three steps — what, how,
 * start — and the start button says what it is starting.
 *
 * Six is the ceiling, and it is a drawing rule rather than a limit on the
 * product: past six the grid stops being one glance and a seventh way is a
 * scroll before a child has chosen anything. A module with more than six ways
 * has a question to answer about which six to offer, and it should have to
 * answer it here rather than quietly growing a row.
 */

export interface PracticeForm {
  readonly id: ModeId;
  readonly name: TranslationKey;
  /** One line saying what this is for, which is what makes the order legible. */
  readonly reason: TranslationKey;
  readonly icon: ComponentType<Omit<IconProps, 'children'>>;
  /** How the round ends, or null for exploring, which is not a round. */
  readonly rule: RoundRule | null;
  /**
   * Seconds one question tends to take, for the estimate beside the start
   * button. Null where there is nothing honest to estimate: a round that ends
   * on three lives is exactly as long as the child is good.
   */
  readonly seconds: number | null;
  /** Only offered once the clock is switched on, which it is not by default (K10). */
  readonly needsClock: boolean;
}

/** One glance, not a scroll. See the note above. */
export const MAX_FORMS = 6;

/**
 * Topography: the four that teach, then the two that put pressure on what is
 * already taught.
 *
 * Pointing asks where something is and is where a child meets a set for the
 * first time. Multiple choice narrows the field to four and is the step up to
 * typing rather than a way around it. Typing asks for the name unaided, which
 * is what a test will ask. Exploring asks nothing at all.
 */
export const TOPO_FORMS: readonly PracticeForm[] = [
  {
    id: 'wijs-aan',
    name: 'mode.wijs-aan',
    reason: 'way.wijs-aan',
    icon: PointIcon,
    rule: ROUND_RULE['wijs-aan'],
    seconds: 10,
    needsClock: false,
  },
  {
    id: 'meerkeuze',
    name: 'mode.meerkeuze',
    reason: 'way.meerkeuze',
    icon: ChoiceIcon,
    rule: ROUND_RULE.meerkeuze,
    seconds: 8,
    needsClock: false,
  },
  {
    id: 'hoe-heet-dit',
    name: 'mode.hoe-heet-dit',
    reason: 'way.hoe-heet-dit',
    icon: KeyboardIcon,
    rule: ROUND_RULE['hoe-heet-dit'],
    seconds: 14,
    needsClock: false,
  },
  {
    id: 'ontdekken',
    name: 'mode.ontdekken',
    reason: 'way.ontdekken',
    icon: ExploreIcon,
    rule: null,
    seconds: null,
    needsClock: false,
  },
  {
    id: 'bliksemronde',
    name: 'mode.bliksemronde',
    reason: 'way.bliksemronde',
    icon: BoltIcon,
    rule: ROUND_RULE.bliksemronde,
    seconds: null,
    needsClock: true,
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: ROUND_RULE.overleven,
    seconds: null,
    needsClock: false,
  },
];

/**
 * The tables. Typing first and choosing second, which is the opposite of the
 * map and deliberate: four plausible products can be narrowed by a child who
 * cannot do the sum, so multiple choice measures less here. It is the way back
 * in when typing is going badly, not the way in (ADR-049).
 *
 * Four rather than six, and nothing is padded to make up the number. There is
 * no exploring for a table because there is nothing to look at — the seventh
 * sum of the table of seven is not somewhere a child can wander.
 */
export const SUM_FORMS: readonly PracticeForm[] = [
  {
    id: 'som-typen',
    name: 'mode.som-typen',
    reason: 'way.som-typen',
    icon: KeyboardIcon,
    rule: SUM_ROUND_RULE['som-typen'],
    seconds: 8,
    needsClock: false,
  },
  {
    id: 'som-meerkeuze',
    name: 'mode.som-meerkeuze',
    reason: 'way.som-meerkeuze',
    icon: ChoiceIcon,
    rule: SUM_ROUND_RULE['som-meerkeuze'],
    seconds: 6,
    needsClock: false,
  },
  {
    id: 'bliksemronde',
    name: 'mode.bliksemronde',
    reason: 'way.bliksemronde',
    icon: BoltIcon,
    rule: SUM_ROUND_RULE.bliksemronde,
    seconds: null,
    needsClock: true,
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: SUM_ROUND_RULE.overleven,
    seconds: null,
    needsClock: false,
  },
];

export function formsFor(moduleId: string): readonly PracticeForm[] {
  return moduleId === 'tafels' ? SUM_FORMS : TOPO_FORMS;
}

/** What is actually drawn: what the clock setting allows, capped at six. */
export function offeredForms(
  forms: readonly PracticeForm[],
  clock: boolean,
): readonly PracticeForm[] {
  return forms.filter((form) => clock || !form.needsClock).slice(0, MAX_FORMS);
}

/** How many questions this way of practising asks of this set, where it is knowable. */
export function questionCount(form: PracticeForm, setSize: number): number | null {
  if (form.rule === null || form.rule.kind !== 'fixed') return null;
  return Math.min(setSize, form.rule.aantal);
}

/**
 * Roughly how long it takes, in whole minutes, or null where saying would be
 * guessing.
 *
 * The design puts this beside the start button, and it earns its place with a
 * parent as much as with a child: "ongeveer vier minuten" is the difference
 * between practice before dinner and practice tomorrow. The per-question
 * figures are held here rather than measured, and they are deliberately round —
 * a number to the minute would claim a precision this does not have.
 */
export function minutesFor(form: PracticeForm, questions: number | null): number | null {
  if (form.rule === null) return null;
  if (form.rule.kind === 'tijd') return Math.max(1, Math.round(form.rule.seconden / 60));
  if (form.rule.kind === 'levens') return null;
  if (form.seconds === null || questions === null) return null;
  return Math.max(1, Math.round((questions * form.seconds) / 60));
}

/**
 * What the start button says, which is the last thing a child reads before a
 * round and therefore has to be what the round is.
 *
 * The measure comes from the rule rather than from the copy, so a round whose
 * clock is changed cannot end up with a button still promising sixty seconds.
 */
export function startLabel(form: PracticeForm, setNaam: string, setSize: number): string {
  const hoe = t(form.name).toLocaleLowerCase('nl-NL');

  if (form.rule === null) return t('choose.startOpen', { set: setNaam, hoe });
  if (form.rule.kind === 'tijd') {
    return t('choose.startTime', { set: setNaam, hoe, seconden: form.rule.seconden });
  }
  if (form.rule.kind === 'levens') {
    return t('choose.startLives', { set: setNaam, hoe, aantal: form.rule.levens });
  }
  return t('choose.start', { set: setNaam, hoe, aantal: Math.min(setSize, form.rule.aantal) });
}
