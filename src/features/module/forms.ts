import type { ComponentType } from 'react';
import {
  BoltIcon,
  ChoiceIcon,
  DiplomaIcon,
  ExploreIcon,
  KeyboardIcon,
  PointIcon,
  ShieldIcon,
  StopwatchIcon,
  type IconProps,
} from '@/components/Icon';
import type { ModeId, RoundRule } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { isMixSet, ROUND_RULE, SETS, type SetId } from '@/features/practice/useRound';
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

/**
 * One glance, not a scroll. See the note above.
 *
 * Seven since ADR-090, and the number moved because the drawing did. Six was
 * the ceiling on a **grid of cards**, each with a name and a line under it;
 * ADR-089 replaced those with chips — a mark and a word, sized to what they say,
 * wrapping onto the next line when the row runs out — and the region row
 * directly above this one has held eight of exactly that chip ever since.
 *
 * So the ceiling still means what it meant: as many ways as a child can take in
 * at a glance, on the row as it is actually drawn. What it may never become is
 * a number nobody has to argue with. A module that wants an eighth has the same
 * question to answer here that a seventh had.
 */
export const MAX_FORMS = 7;

/**
 * Topography: the four that teach, then the two that put pressure on what is
 * already taught.
 *
 * Pointing asks where something is and is where a child meets a set for the
 * first time. Multiple choice narrows the field to four and is the step up to
 * typing rather than a way around it. Typing asks for the name unaided, which
 * is what a test will ask. Exploring asks nothing at all.
 *
 * Then the three that put pressure on what is already taught, mildest first: a
 * **tijdrit** times the same pointing and keeps the best time, a
 * **bliksemronde** puts sixty seconds on it, and **overleven** gives three
 * lives. The first of those takes nothing away and the other two do, which is
 * both the order and the reason only one of them is behind K10's switch.
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
    /*
     * The tijdrit: the same pointing, against the clock, for a record.
     *
     * First of the three that put pressure on, because it is the mildest of
     * them: nothing is taken away and nothing runs out. The round is the same
     * list of questions wijs-aan asks and waits exactly as long as the child
     * needs — what it adds is that it says afterwards how long that was.
     *
     * **Not behind the clock setting, and that is the line worth being able to
     * defend.** K10 switches off the *time limit*: a bliksemronde ends when its
     * sixty seconds do, so a child who was thinking loses the question they
     * were thinking about, and a settings page that says haste does not help
     * you remember cannot leave that on by default. A stopwatch takes nothing.
     * It measures something a child is already doing and reports it, which is
     * the difference between a clock that answers for you and one that watches
     * (ADR-090).
     */
    id: 'tijdrit',
    name: 'mode.tijdrit',
    reason: 'way.tijdrit',
    icon: StopwatchIcon,
    rule: ROUND_RULE.tijdrit,
    // Faster than pointing, by design and by the whole point of it.
    seconds: 6,
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

export function formsFor(moduleId: string): readonly PracticeForm[] {
  return moduleId === 'tafels' ? SUM_FORMS : TOPO_FORMS;
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
  //
  // Both ways of pointing move, in the order they were in. A tijdrit is
  // pointing with a stopwatch on it, and asking a child to hit a coastline
  // three pixels wide *quickly* is the same rule failing twice over.
  if (!krap) return offered;
  const wijzen = offered.filter((form) => AANWIJZEN.includes(form.id));
  return [...offered.filter((form) => !AANWIJZEN.includes(form.id)), ...wijzen];
}

/** The ways of practising that ask a child to hit something on the map. */
const AANWIJZEN: readonly ModeId[] = ['wijs-aan', 'tijdrit'];

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

/**
 * How many shapes the world set now puts in front of a child at once.
 *
 * Not a hundred and sixty-seven. A question about the world is asked on the map
 * of the country's werelddeel (ADR-091), so the map that has to be pointed at
 * is Afrika at its largest — the biggest of the six, from the table above — and
 * the world's own row in that table describes a map this round no longer draws.
 *
 * Which flips the laptop case and leaves the phone case exactly where it was:
 * fifty-two countries are pointable on a laptop and are not pointable on a
 * phone, the same as every other werelddeel.
 */
export const GROOTSTE_WERELDDEEL = 52;

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

  // What is on the map, which is not always what is in the set. See above.
  const opDeKaart = shape.kaartPerItem === 'werelddeel' ? GROOTSTE_WERELDDEEL : aantalVormen;

  return opDeKaart > (kleinScherm ? KRAP_OP_EEN_TELEFOON : KRAP_OVERAL);
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
 * The lengths worth offering for this way of practising on this set, or none.
 *
 * Empty where there is nothing to choose: a round that ends on a clock or on
 * three lives has no number of questions, a diploma is the whole table by
 * definition, and a set of ten has one honest answer.
 */
export function questionChoices(form: PracticeForm, setSize: number): number[] {
  if (form.rule === null || form.rule.kind !== 'fixed') return [];
  const fits = QUESTION_CHOICES.filter((count) => count <= setSize);
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
