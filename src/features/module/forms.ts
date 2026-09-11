import type { ComponentType } from 'react';
import {
  BoltIcon,
  ChoiceIcon,
  DiplomaIcon,
  ExploreIcon,
  KeyboardIcon,
  PointIcon,
  ShieldIcon,
  type IconProps,
} from '@/components/Icon';
import type { ModeId, RoundRule } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { isMixSet, ROUND_RULE, SETS, type SetId } from '@/features/practice/useRound';
import { SUM_ROUND_RULE } from '@/features/sums/useSumRound';
import { KLOK_ROUND_RULE } from '@/features/klok/useKlokRound';

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
  /**
   * Which sets this way of practising is offered for. Absent means all of them.
   *
   * Two ways need it and both for the same kind of reason. **Ontdekken** is
   * where a child meets a set for the first time, and a mix of everything is
   * not where anyone meets anything for the first time. A **tafeldiploma** is a
   * diploma for one table, so it is offered on a table and nowhere else — there
   * is no such thing as a diploma for "alle tafels door elkaar", and offering
   * one on a mix would mean inventing a certificate no school hands out.
   */
  readonly geldtVoor?: (setId: string) => boolean;
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
    geldtVoor: (setId) => !isMixSet(setId),
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
  {
    // Last, because it is the heaviest thing rekenen asks and because it is not
    // practice: it is the test at the end of it, the one a child already knows
    // from school. Ten sums, all of them right, and one mistake ends the
    // attempt — which is what makes it worth having and why it is not offered
    // as the way in.
    //
    // No clock, and that is a departure from the tafeltoets a teacher gives.
    // The product says on its own settings page that haste does not help you
    // remember, and it does not switch that off for the one exercise where a
    // child would feel it most (ADR-064).
    id: 'tafeldiploma',
    name: 'mode.tafeldiploma',
    reason: 'way.tafeldiploma',
    icon: DiplomaIcon,
    rule: SUM_ROUND_RULE.tafeldiploma,
    seconds: 8,
    needsClock: false,
    geldtVoor: (setId) => /^tafel-\d+$/.test(setId),
  },
];

/**
 * Klokkijken: the two that read a face, the one that reads it backwards, then
 * the two that put pressure on what is already read.
 *
 * **Choosing comes first here**, which is the map's order rather than the
 * tables'. ADR-049 put typing first on rekenen because four plausible products
 * can be narrowed by a child who cannot do the sum, so multiple choice measures
 * less there. A clock is the opposite: the four times offered are the four
 * mistakes children actually make reading one — an hour out, over for voor, the
 * hands swapped — so choosing between them is the exercise rather than a way
 * round it (`klokDistractors`).
 *
 * **"Welke klok" is the second, and it is not multiple choice turned round.**
 * The other four ways all show a face and ask what it says. This one shows a
 * time and asks which of four faces says it, which is the half of clock reading
 * that a child who has only ever been shown clocks has never been asked. It is
 * also the half a schoolbook drills hardest, because it is the one that catches
 * a child who has learned to recognise twelve pictures.
 *
 * **Typing is third and last of the three that teach**, for the reason the map
 * gives: writing "7:35" unaided is what a test asks.
 *
 * Five rather than six, and nothing is padded to make up the number. There is
 * no exploring on a clock — twelve faces is not somewhere a child can wander —
 * and there is no diploma, because no Dutch school hands one out for the clock
 * the way it does for a table.
 */
export const KLOK_FORMS: readonly PracticeForm[] = [
  {
    id: 'klok-meerkeuze',
    name: 'mode.klok-meerkeuze',
    reason: 'way.klok-meerkeuze',
    icon: ChoiceIcon,
    rule: KLOK_ROUND_RULE['klok-meerkeuze'],
    seconds: 10,
    needsClock: false,
  },
  {
    id: 'klok-welke-klok',
    name: 'mode.klok-welke-klok',
    reason: 'way.klok-welke-klok',
    // Pointing, because that is what it is: four faces and a finger. The mark
    // is the map's, and the two are never on a page together.
    icon: PointIcon,
    rule: KLOK_ROUND_RULE['klok-welke-klok'],
    seconds: 12,
    needsClock: false,
  },
  {
    id: 'klok-typen',
    name: 'mode.klok-typen',
    reason: 'way.klok-typen',
    icon: KeyboardIcon,
    rule: KLOK_ROUND_RULE['klok-typen'],
    seconds: 14,
    needsClock: false,
  },
  {
    id: 'bliksemronde',
    name: 'mode.bliksemronde',
    reason: 'way.bliksemronde',
    icon: BoltIcon,
    rule: KLOK_ROUND_RULE.bliksemronde,
    seconds: null,
    needsClock: true,
  },
  {
    id: 'overleven',
    name: 'mode.overleven',
    reason: 'way.overleven',
    icon: ShieldIcon,
    rule: KLOK_ROUND_RULE.overleven,
    seconds: null,
    needsClock: false,
  },
];

/**
 * The way the oefentoets answers in, per module: typing, because that is what a
 * test asks — the name unaided, the sum unaided, the time written out. The
 * oefentoets is a tile of its own and pressing it chooses this way too, so a
 * child is never asked to pick a way a test does not have (ADR-100).
 */
const TOETS_VORM: Record<string, ModeId> = {
  topo: 'hoe-heet-dit',
  tafels: 'som-typen',
  klok: 'klok-typen',
};

/** The way the oefentoets uses, if this page offers it; null otherwise. */
export function toetsVormVan(
  moduleId: string,
  forms: readonly PracticeForm[],
): PracticeForm | null {
  return forms.find((form) => form.id === TOETS_VORM[moduleId]) ?? null;
}

export function formsFor(moduleId: string): readonly PracticeForm[] {
  if (moduleId === 'tafels') return SUM_FORMS;
  if (moduleId === 'klok') return KLOK_FORMS;
  return TOPO_FORMS;
}

/**
 * What is actually drawn: what the clock setting allows and what the chosen set
 * can be practised in, capped at six.
 *
 * The set is part of it because step 2 is about a set that step 1 has already
 * named. A way of practising that does not apply to it is not greyed out — it
 * is absent, the same way an unbuilt module is absent from the rail: a disabled
 * control on a chooser is a question a child has to ask someone about.
 */
export function offeredForms(
  forms: readonly PracticeForm[],
  clock: boolean,
  setId: string | null,
  krap = false,
): readonly PracticeForm[] {
  const offered = forms
    .filter((form) => clock || !form.needsClock)
    .filter((form) => setId === null || !form.geldtVoor || form.geldtVoor(setId))
    .slice(0, MAX_FORMS);

  // On a map too crowded to point at, pointing goes last rather than first. It
  // is still offered — see `teDrukOmAanTeWijzen` for why it is moved and not
  // removed — and what leads instead is multiple choice, where the map lights a
  // country up and the child answers in words.
  if (!krap) return offered;
  const wijzen = offered.filter((form) => form.id === 'wijs-aan');
  return [...offered.filter((form) => form.id !== 'wijs-aan'), ...wijzen];
}

/**
 * How many shapes a map may hold before pointing at it is worth offering first.
 *
 * Measured rather than guessed. For each map the build makes, count the
 * countries that end up with neither a usable help ring nor enough of their own
 * area for a fingertip — the ones a child simply cannot hit:
 *
 * ```
 * regio           landen   laptop   tablet   telefoon
 * Zuid-Amerika        12        0        0          1
 * Oceanië              9        1        1          1
 * Noord-Amerika       23       12       13         20
 * Europa              46        4        7         21
 * Azië                47        5        9         29
 * Afrika              52        5        9         19
 * Wereld             167       90      106        160
 * ```
 *
 * Two lines fall out of that table and both are here as numbers rather than as
 * a feeling. **Past fifteen shapes a map is no longer pointable on a phone**,
 * where it gets about two hundred pixels of height — Zuid-Amerika and Oceanië
 * stay, everything larger goes. **Past a hundred it is not pointable
 * anywhere**, which is the world map and only the world map: ninety of its
 * hundred and sixty-seven countries are unreachable on a laptop.
 *
 * Point sets are exempt. A city is already drawn as a marker sized for a finger
 * (`reachablePoints`), so eighty cities are eighty targets; it is *shapes* that
 * ask a child to hit a coastline.
 *
 * Moved, never removed. On a digibord a class points at the world map together,
 * and a rule about phones has no business taking that away — what it may do is
 * stop handing a ten-year-old on a bus the one way of practising that will not
 * work for them (ADR-087).
 */
export const KRAP_OP_EEN_TELEFOON = 15;
export const KRAP_OVERAL = 100;

export function teDrukOmAanTeWijzen(
  setId: string | null,
  aantalVormen: number,
  kleinScherm: boolean,
): boolean {
  if (setId === null) return false;
  const shape = SETS[setId as SetId];
  // A set the map does not know, or one answered on markers rather than on its
  // own outlines. Neither is what this rule is about.
  if (!shape || shape.answers === 'points') return false;

  return aantalVormen > (kleinScherm ? KRAP_OP_EEN_TELEFOON : KRAP_OVERAL);
}

/**
 * How long a round may be made, when a child wants to say.
 *
 * Ten is what a round has always been and stays the default. The other three
 * exist because the sets stopped being ten: the Rekenmix holds five hundred
 * sums and the Topomix a hundred and fifteen, and "oefen tien" of five hundred
 * is a child who never finishes anything (ADR-074).
 *
 * Only the ones that fit are offered. Choosing fifty of a table of ten is a
 * button that lies — the round would ask ten and the estimate beside it would
 * have said six minutes.
 */
export const QUESTION_CHOICES: readonly number[] = [10, 25, 50, 100];

/**
 * The biggest set that is offered whole, as "Alle 12". Past a hundred a whole
 * set is not a round, it is an afternoon: the world's hundred and sixty-seven
 * countries stop at a hundred.
 */
const HEEL_TOT = 100;

/**
 * The lengths worth offering for this way of practising on this set, or none.
 *
 * The four above that fit, the round's own length — fifteen on the map, which
 * is what a round asks when nobody chooses and so has to be something a child
 * can choose back — and the whole set where it fits in one round. Without those
 * last two the row never appeared on topography: twelve provinces fit only
 * "10", and one chip is not a choice (ADR-100).
 *
 * Empty where there is nothing to choose: a round that ends on a clock or on
 * three lives has no number of questions, a diploma is the whole table by
 * definition, and a set of ten has one honest answer.
 */
export function questionChoices(form: PracticeForm, setSize: number): number[] {
  if (form.rule === null || form.rule.kind !== 'fixed') return [];
  const korter = [...new Set([...QUESTION_CHOICES, form.rule.aantal])]
    .filter((count) => count < setSize)
    .sort((a, b) => a - b);
  const fits = setSize <= HEEL_TOT ? [...korter, setSize] : korter;
  return fits.length > 1 ? fits : [];
}

/**
 * How many questions this way of practising asks of this set, where it is
 * knowable — the child's choice if they made one, and the round's own length
 * if they did not.
 *
 * Capped at the set either way. A set cannot be asked more questions than it
 * holds without repeating itself inside one round, which teaches a child that
 * the app has run out rather than that they have.
 */
export function questionCount(
  form: PracticeForm,
  setSize: number,
  chosen: number | null = null,
): number | null {
  if (form.rule === null || form.rule.kind !== 'fixed') return null;
  const wanted =
    chosen !== null && questionChoices(form, setSize).includes(chosen) ? chosen : form.rule.aantal;
  return Math.min(setSize, wanted);
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
export function startLabel(
  form: PracticeForm,
  setNaam: string,
  setSize: number,
  chosen: number | null = null,
): string {
  const hoe = t(form.name).toLocaleLowerCase('nl-NL');

  if (form.rule === null) return t('choose.startOpen', { set: setNaam, hoe });
  if (form.rule.kind === 'tijd') {
    return t('choose.startTime', { set: setNaam, hoe, seconden: form.rule.seconden });
  }
  if (form.rule.kind === 'levens') {
    return t('choose.startLives', { set: setNaam, hoe, aantal: form.rule.levens });
  }
  return t('choose.start', {
    set: setNaam,
    hoe,
    aantal: questionCount(form, setSize, chosen) ?? form.rule.aantal,
  });
}
