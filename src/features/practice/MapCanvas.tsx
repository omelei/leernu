import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  fitView,
  helpTargetFor,
  helpTargets,
  keyboardOrder,
  MIN_TOUCH_PX,
  reachablePoints,
  type HelpTarget,
  type ViewFit,
} from '@/game-core';
import type { GeoSet, PointSet, Punt, Vorm } from '@/content/loadGeo';
import { Dot } from '@/components/Dot';

/**
 * The map, and the only place the answer is shown.
 *
 * Follows docs/leer.nu oefenkaart.html. Three choices there are worth keeping in
 * mind while reading this:
 *
 * - Four answer states, each told apart by shape before colour (ADR-043): a
 *   correct answer is closed with a tick, a near miss is open with one heavier
 *   rule and a half-filled dot, a wrong one is hatched with a cross, and the
 *   right answer the child did not give has a double rule and a full dot. Shape
 *   rather than colour alone, so all four survive colour blindness and grey.
 * - After a wrong answer a dot **travels** from the place the child pointed at
 *   to the right one. The one moment in this product where movement teaches
 *   instead of decorates: the child sees the distance they were out by.
 * - Anything too small to hit gets an invisible circle exactly 48 CSS pixels
 *   across, whatever the map is scaled to — which is why the canvas measures
 *   itself rather than assuming a size.
 *
 * Three exercises share one canvas, and the only difference between them is
 * *what answers*: the provinces themselves, the islands laid over them, or the
 * capitals as points. Saying that in the types is what keeps a fourth
 * arrangement from becoming a fourth branch inside every function here.
 */

export type AnswerLayer =
  /** The background provinces are themselves the answers. */
  | { readonly kind: 'background' }
  /** Separate shapes over dimmed provinces: the Wadden islands. */
  | { readonly kind: 'shapes'; readonly set: GeoSet }
  /** Points over dimmed provinces: the provincial capitals. */
  | { readonly kind: 'points'; readonly set: PointSet };

/**
 * `pick` — the child answers by pointing, so every answer is a control and
 * nothing is highlighted: the highlight would be the answer.
 * `show` — the child answers by typing, so the map highlights what is being
 * asked about and nothing is clickable.
 * `explore` — nothing is being asked. Both at once: everything is a control and
 * whatever the child chose stays lit.
 */
export type MapInteraction = 'pick' | 'show' | 'explore';

export interface MapCanvasProps {
  /** Always the provinces: the country a child orients by. */
  readonly background: GeoSet;
  readonly answers: AnswerLayer;
  readonly interaction: MapInteraction;
  /** Display name per answer id — what a child is taught, not what the source spells. */
  readonly namesById: ReadonlyMap<string, string>;
  readonly targetId: string;
  readonly chosenId: string | null;
  readonly revealed: boolean;
  /**
   * How the answer was judged, once it is revealed.
   *
   * The map cannot work this out on its own. Pointing at the right shape is
   * visible here, but a typed answer has no chosen shape at all, and "bijna" —
   * naming another real place that is nearly the one asked for (ADR-017) — is a
   * verdict the answer module reaches, not a position on a map.
   */
  readonly verdict?: 'correct' | 'near' | 'wrong' | undefined;
  readonly onPick: (id: string) => void;
}

/** The map's rendered box in CSS pixels, so touch targets can be real. */
function useRenderedSize(ref: React.RefObject<SVGSVGElement | null>): {
  readonly width: number;
  readonly height: number;
} {
  const [size, setSize] = useState({ width: 600, height: 600 });

  // Measured before the browser paints, not after.
  //
  // 600 is a guess, and everything that decides which cities can be drawn at all
  // is computed from this number (reachablePoints, helpTargetFor). Waiting for
  // the ResizeObserver meant the first paint used the guess, so on a screen
  // shorter than 600 the map drew points a finger could not separate and then
  // corrected itself — visible as a flicker, and long enough for a test to
  // catch two cities on top of each other.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const box = element.getBoundingClientRect();
    if (box.height > 0 && box.width > 0) setSize({ width: box.width, height: box.height });
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

type AnswerState = 'open' | 'asked' | 'correct' | 'near' | 'wrong' | 'missed';

function stateOf(
  id: string,
  targetId: string,
  chosenId: string | null,
  revealed: boolean,
  interaction: MapInteraction,
  verdict?: 'correct' | 'near' | 'wrong',
): AnswerState {
  if (revealed) {
    if (id === targetId) {
      // The three ways the right shape can end a question, and they must not
      // look alike: the child found it, the child nearly named it, or the child
      // is being shown it. Before step 7 all three drew the same green outline,
      // which told a child who had just got it wrong that they had got it right.
      if (verdict === 'near') return 'near';
      if (verdict === 'correct' || chosenId === targetId) return 'correct';
      return 'missed';
    }
    if (id === chosenId) return 'wrong';
    return 'open';
  }
  // Lit everywhere except `pick`, where the question is precisely which one it is.
  return interaction !== 'pick' && id === targetId ? 'asked' : 'open';
}

export function MapCanvas({
  background,
  answers,
  interaction,
  namesById,
  targetId,
  chosenId,
  revealed,
  verdict,
  onPick,
}: MapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rendered = useRenderedSize(svgRef);

  const [, , viewWidth, viewHeight] = background.viewBox;

  // The height of the *drawing*, which is not the height of the element.
  //
  // An SVG keeps its aspect ratio, so on a screen narrower than the map is wide
  // the drawing is scaled to the width and sits with space above and below it.
  // Taking the scale from the element's height then overstates it, which makes
  // 48 CSS pixels look like fewer map units than it is, which lets
  // reachablePoints keep two cities a finger cannot separate. On a phone, where
  // the map area is tall and narrow, that is most of the error.
  const drawnHeight =
    rendered.width > 0 && rendered.height > 0
      ? Math.min(rendered.height, (rendered.width * viewHeight) / viewWidth)
      : rendered.height;

  // Memoised because reachablePoints keys off it: a fresh object every render
  // would recompute the whole layer on every keystroke.
  const fit = useMemo(() => fitView(viewHeight, drawnHeight), [viewHeight, drawnHeight]);

  const answerShapes = useMemo(() => {
    if (answers.kind === 'background') return keyboardOrder(background.vormen as Vorm[]);
    if (answers.kind === 'shapes') return keyboardOrder(answers.set.vormen as Vorm[]);
    return [] as Vorm[];
  }, [answers, background]);

  const clickable = interaction !== 'show' && !revealed;

  /**
   * The rings, worked out over the whole map at once rather than per shape.
   *
   * A ring takes over as the target from the shape underneath it, so two that
   * overlap are two ways to hit the wrong country. `helpTargets` keeps only the
   * ones nothing else reaches — every ring on the Wadden islands, almost none
   * on a world map at phone size, which is the difference between help and
   * clutter (ADR-086).
   */
  const rings = useMemo(
    () =>
      clickable
        ? helpTargets(answerShapes, fit, (shape) => shape.punt)
        : new Map<string, HelpTarget>(),
    [clickable, answerShapes, fit],
  );

  /**
   * Where the question is, when the question is too small to see.
   *
   * Choosing and typing do not ask a child to hit anything — the map lights a
   * country up and they answer in words — which is what makes those two the way
   * in on a crowded map (ADR-087). It leaves the other half of the problem: on a
   * map of the world, the country being asked about is three pixels of coastline
   * and a child cannot *find* it either.
   *
   * So a ring says where. Not a target and not pressable — nothing is pressable
   * in these two modes — and drawn in the accent rather than in ink, because it
   * is the one thing on the map that is about the question.
   */
  const wijzer = useMemo(() => {
    if (interaction !== 'show') return null;
    const doel = answerShapes.find((shape) => shape.id === targetId);
    return doel ? helpTargetFor(doel.bbox, fit, doel.punt) : null;
  }, [interaction, answerShapes, targetId, fit]);

  // Every point that is drawn must be hittable, including the ones the child
  // does not want. See reachablePoints: with eighty cities in the set, drawing
  // them all would put answers six pixels apart.
  const answerPoints = useMemo(
    () => (answers.kind === 'points' ? reachablePoints(answers.set.punten, fit, targetId) : []),
    [answers, fit, targetId],
  );

  function positionOf(id: string): readonly [number, number] | null {
    const shape = answerShapes.find((candidate) => candidate.id === id);
    if (shape) return shape.punt;
    return answerPoints.find((point) => point.id === id)?.punt ?? null;
  }

  const targetPos = positionOf(targetId);
  const chosenPos = chosenId === null ? null : positionOf(chosenId);
  const showTravel =
    revealed &&
    chosenId !== null &&
    chosenId !== targetId &&
    chosenPos !== null &&
    targetPos !== null;

  function handleKey(event: KeyboardEvent<Element>, id: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPick(id);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={background.viewBox.join(' ')}
      className="block h-full w-full"
      role="group"
    >
      <defs>
        {/* The wrong-answer texture: white ground with narrow red stripes at 45
            degrees, faint enough that the shape underneath stays readable. */}
        <pattern
          id="tk-hatch"
          width="8"
          height="8"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="8" height="8" fill="var(--paper)" />
          <rect width="3" height="8" fill="var(--bad)" opacity="0.25" />
        </pattern>
      </defs>

      {/* The country, always drawn. When it is not the answer it recedes, but it
          is never decoration: it is how a child knows where on the map they are. */}
      {answers.kind !== 'background' &&
        background.vormen.map((vorm) => (
          <path key={vorm.id} d={vorm.d} className="tk-shape-dim" aria-hidden="true" />
        ))}

      {answerShapes.map((shape) => (
        <AnswerShape
          key={shape.id}
          shape={shape}
          name={namesById.get(shape.id) ?? shape.bronnaam}
          state={stateOf(shape.id, targetId, chosenId, revealed, interaction, verdict)}
          dimmedWhenOpen={interaction === 'show'}
          clickable={clickable}
          help={rings.get(shape.id) ?? null}
          onPick={() => clickable && onPick(shape.id)}
          onKeyDown={(event) => clickable && handleKey(event, shape.id)}
        />
      ))}

      {answerPoints
        .filter((point) => clickable || revealed || point.id === targetId)
        .map((point) => (
          <CityMarker
            key={point.id}
            point={point}
            name={namesById.get(point.id) ?? point.bronnaam}
            state={stateOf(point.id, targetId, chosenId, revealed, interaction, verdict)}
            clickable={clickable}
            fit={fit}
            onPick={() => clickable && onPick(point.id)}
            onKeyDown={(event) => clickable && handleKey(event, point.id)}
          />
        ))}

      {/* Which one is being asked about, where it is too small to find. Drawn
          after the shapes so a neighbour cannot cover it. */}
      {wijzer !== null && (
        <circle
          cx={wijzer.cx}
          cy={wijzer.cy}
          r={wijzer.r * 0.85}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          aria-hidden="true"
          pointerEvents="none"
        />
      )}

      {/* Drawn before the label so the label stays on top of it. */}
      {showTravel && chosenPos !== null && targetPos !== null && (
        <TravelPath from={chosenPos} to={targetPos} />
      )}

      {/* The mark that says which of the four states this is, drawn after the
          shapes so it never ends up underneath one. */}
      {revealed && targetPos !== null && (
        <StateMark
          state={stateOf(targetId, targetId, chosenId, revealed, interaction, verdict)}
          x={targetPos[0]}
          y={targetPos[1]}
        />
      )}
      {revealed && chosenPos !== null && chosenId !== targetId && (
        <StateMark state="wrong" x={chosenPos[0]} y={chosenPos[1]} />
      )}

      {revealed && targetPos !== null && (
        <MapLabel
          x={targetPos[0]}
          y={targetPos[1]}
          text={namesById.get(targetId) ?? ''}
          /* Below the point, never on it: a name printed over what the child was
             asked to find hides the very thing they should be looking at. */
          offsetY={answers.kind === 'points' ? 30 : 26}
        />
      )}
    </svg>
  );
}

function shapeClass(state: AnswerState, dimmedWhenOpen: boolean): string {
  switch (state) {
    case 'correct':
      return 'tk-shape tk-shape-correct';
    case 'near':
      return 'tk-shape tk-shape-near';
    case 'wrong':
      return 'tk-shape tk-shape-wrong';
    case 'missed':
      return 'tk-shape tk-shape-missed-outer';
    case 'asked':
      return 'tk-shape tk-shape-asked';
    default:
      return dimmedWhenOpen ? 'tk-shape-dim' : 'tk-shape';
  }
}

/**
 * The four answer states, as marks.
 *
 * Colour adds speed and shape carries the meaning, so each of these has to be
 * told apart in grey: a tick, a cross, a half-filled dot and a full one.
 *
 * "Bijna" gets no mark of its own and no colour of its own. A tick would say
 * it was right and a cross would say it was wrong, and it is neither; amber
 * would be a fifth thing to learn, and the hatch already belongs to wrong.
 * What it gets is the half-filled dot — the same half-filled dot that means
 * "practised, not yet certain" on K9, drawn by the same component, because it
 * is the same idea arriving at a different moment.
 */
function StateMark({
  state,
  x,
  y,
}: {
  readonly state: AnswerState;
  readonly x: number;
  readonly y: number;
}) {
  // Map units, so the mark grows and shrinks with the map rather than floating
  // at a fixed size over a country that has zoomed away from it.
  const size = 22;

  if (state === 'correct') {
    // Paper, not ink: this is the only state with a solid fill under its mark.
    return (
      <path
        d={`M ${x - 7} ${y} l 5 5 l 9 -11`}
        className="tk-mark tk-mark-on-fill"
        aria-hidden="true"
      />
    );
  }

  if (state === 'wrong') {
    return (
      <g aria-hidden="true" className="tk-mark">
        <path d={`M ${x - 6} ${y - 6} l 12 12`} />
        <path d={`M ${x + 6} ${y - 6} l -12 12`} />
      </g>
    );
  }

  if (state === 'near' || state === 'missed') {
    return (
      <g transform={`translate(${x - size / 2}, ${y - size / 2})`} aria-hidden="true">
        <Dot size={size} fill={state === 'near' ? 0.5 : 1} />
      </g>
    );
  }

  return null;
}

function AnswerShape({
  shape,
  name,
  state,
  dimmedWhenOpen,
  clickable,
  help,
  onPick,
  onKeyDown,
}: {
  readonly shape: Vorm;
  readonly name: string;
  readonly state: AnswerState;
  readonly dimmedWhenOpen: boolean;
  readonly clickable: boolean;
  /** The ring this shape is hit with, where it has one. See `rings` above. */
  readonly help: HelpTarget | null;
  readonly onPick: () => void;
  readonly onKeyDown: (event: KeyboardEvent<Element>) => void;
}) {
  // Ameland is 72 units long and 16 wide: judged on its long side it looks like
  // a comfortable target, and a finger disagrees. Anything too narrow to land on
  // gets a circle it can actually be hit with — decided over the whole map, so
  // two rings never reach each other (`rings` in MapCanvas).
  const pathIsTheTarget = clickable && help === null;

  return (
    <g>
      {/* The double rule of "gemist". SVG has no double stroke, so the path is
          drawn twice: the wide ink one below, a narrow paper one on top, which
          leaves two bands of ink with a gap between them. */}
      {state === 'missed' && (
        <path d={shape.d} className="tk-shape-missed-inner" aria-hidden="true" />
      )}
      <path
        d={shape.d}
        className={shapeClass(state, dimmedWhenOpen)}
        {...(pathIsTheTarget
          ? { tabIndex: 0, role: 'button', 'aria-label': name, onClick: onPick, onKeyDown }
          : { 'aria-hidden': true, pointerEvents: 'none' as const })}
      />
      {help !== null && (
        <>
          {/* Shown, not just felt: the ring tells a child there is more room
              than the coastline suggests, which is the difference between a
              target that works and one that only technically works. */}
          <circle
            cx={help.cx}
            cy={help.cy}
            r={help.r * 0.75}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.3}
            pointerEvents="none"
          />
          <circle
            cx={help.cx}
            cy={help.cy}
            r={help.r}
            fill="transparent"
            className="cursor-pointer"
            tabIndex={0}
            role="button"
            aria-label={name}
            onClick={onPick}
            onKeyDown={onKeyDown}
          />
        </>
      )}
    </g>
  );
}

function CityMarker({
  point,
  name,
  state,
  clickable,
  fit,
  onPick,
  onKeyDown,
}: {
  readonly point: Punt;
  readonly name: string;
  readonly state: AnswerState;
  readonly clickable: boolean;
  readonly fit: ViewFit;
  readonly onPick: () => void;
  readonly onKeyDown: (event: KeyboardEvent<Element>) => void;
}) {
  const [x, y] = point.punt;
  const radius = helpTargetFor([x, y, x, y], fit)?.r ?? MIN_TOUCH_PX / 2;

  // A point has no area to fill and no room for a double rule, so the four
  // states arrive here as the StateMark drawn beside it plus these two colours.
  // "Bijna" and "gemist" stay ink on paper deliberately: their marks — the half
  // dot and the full one — are what tell them apart, exactly as on an area.
  const fill =
    state === 'correct'
      ? 'var(--good)'
      : state === 'wrong'
        ? 'var(--bad)'
        : state === 'asked'
          ? 'var(--accent-tint)'
          : 'var(--paper)';
  const stroke =
    state === 'correct'
      ? 'var(--good)'
      : state === 'wrong'
        ? 'var(--bad)'
        : state === 'asked'
          ? 'var(--accent)'
          : 'var(--ink)';

  return (
    <g>
      {clickable && (
        <circle
          cx={x}
          cy={y}
          r={radius * 0.6}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2}
          strokeDasharray="4 4"
          opacity={0.35}
          pointerEvents="none"
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={7}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        pointerEvents="none"
      />
      {clickable && (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill="transparent"
          className="cursor-pointer"
          tabIndex={0}
          role="button"
          aria-label={name}
          onClick={onPick}
          onKeyDown={onKeyDown}
        />
      )}
    </g>
  );
}

function TravelPath({
  from,
  to,
}: {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];

  return (
    <g aria-hidden="true" pointerEvents="none">
      <line
        x1={from[0]}
        y1={from[1]}
        x2={to[0]}
        y2={to[1]}
        stroke="var(--ink)"
        strokeWidth={3}
        strokeDasharray="6 6"
      />
      {/* Two fading stepping stones, so the direction of travel is readable
          even when the animation is switched off. */}
      {[
        { at: 0.33, r: 5, opacity: 0.18 },
        { at: 0.66, r: 8, opacity: 0.3 },
      ].map((stone) => (
        <circle
          key={stone.at}
          cx={from[0] + dx * stone.at}
          cy={from[1] + dy * stone.at}
          r={stone.r}
          fill="var(--ink)"
          opacity={stone.opacity}
        />
      ))}
      <circle
        cx={to[0]}
        cy={to[1]}
        r={11}
        fill="var(--ink)"
        style={
          {
            animation: 'tk-travel .32s cubic-bezier(.2,.7,.3,1) 1',
            '--tk-dx': `${-dx}px`,
            '--tk-dy': `${-dy}px`,
          } as React.CSSProperties
        }
      />
    </g>
  );
}

function MapLabel({
  x,
  y,
  text,
  offsetY,
}: {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly offsetY: number;
}) {
  // Width from the character count: close enough at this size, and it avoids
  // measuring text in the DOM on every render.
  const width = text.length * 9 + 20;
  const top = y + offsetY;

  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect
        x={x - width / 2}
        y={top - 14}
        width={width}
        height={26}
        rx={4}
        fill="var(--paper)"
        opacity={0.94}
      />
      <text x={x} y={top + 5} textAnchor="middle" fill="var(--ink)" fontSize={15} fontWeight={700}>
        {text}
      </text>
    </g>
  );
}
