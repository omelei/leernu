import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { fitView, helpTargetFor, keyboardOrder, MIN_TOUCH_PX, type ViewFit } from '@/game-core';
import type { GeoSet, PointSet, Punt, Vorm } from '@/content/loadGeo';

/**
 * The map, and the only place the answer is shown.
 *
 * Follows docs/leer.nu oefenkaart.html. Three choices there are worth keeping in
 * mind while reading this:
 *
 * - A correct answer is **outlined** green on paper, not filled. A wrong one is
 *   filled with a **hatch**. Texture rather than colour alone, so the difference
 *   survives colour blindness and a grey printout.
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
 * `pick` — the child answers by pointing, so every answer is a control.
 * `show` — the child answers by typing, so the map only highlights what is
 * being asked about and nothing is clickable.
 */
export type MapInteraction = 'pick' | 'show';

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
  readonly onPick: (id: string) => void;
}

/** The map's rendered height in CSS pixels, so touch targets can be real. */
function useRenderedHeight(ref: React.RefObject<SVGSVGElement | null>): number {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(entry.contentRect.height || 600);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}

type AnswerState = 'open' | 'asked' | 'target' | 'wrong';

function stateOf(
  id: string,
  targetId: string,
  chosenId: string | null,
  revealed: boolean,
  interaction: MapInteraction,
): AnswerState {
  if (revealed) {
    if (id === targetId) return 'target';
    if (id === chosenId) return 'wrong';
    return 'open';
  }
  return interaction === 'show' && id === targetId ? 'asked' : 'open';
}

export function MapCanvas({
  background,
  answers,
  interaction,
  namesById,
  targetId,
  chosenId,
  revealed,
  onPick,
}: MapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const renderedHeight = useRenderedHeight(svgRef);

  const [, , viewWidth, viewHeight] = background.viewBox;
  const fit = fitView(viewHeight, renderedHeight);

  const answerShapes = useMemo(() => {
    if (answers.kind === 'background') return keyboardOrder(background.vormen as Vorm[]);
    if (answers.kind === 'shapes') return keyboardOrder(answers.set.vormen as Vorm[]);
    return [] as Vorm[];
  }, [answers, background]);

  const answerPoints = answers.kind === 'points' ? answers.set.punten : [];
  const clickable = interaction === 'pick' && !revealed;

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
      className="h-full w-auto max-w-full"
      style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
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
          state={stateOf(shape.id, targetId, chosenId, revealed, interaction)}
          dimmedWhenOpen={interaction === 'show'}
          clickable={clickable}
          fit={fit}
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
            state={stateOf(point.id, targetId, chosenId, revealed, interaction)}
            clickable={clickable}
            fit={fit}
            onPick={() => clickable && onPick(point.id)}
            onKeyDown={(event) => clickable && handleKey(event, point.id)}
          />
        ))}

      {/* Drawn before the label so the label stays on top of it. */}
      {showTravel && chosenPos !== null && targetPos !== null && (
        <TravelPath from={chosenPos} to={targetPos} />
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
    case 'target':
      return 'tk-shape tk-shape-target';
    case 'wrong':
      return 'tk-shape tk-shape-wrong';
    case 'asked':
      return 'tk-shape tk-shape-asked';
    default:
      return dimmedWhenOpen ? 'tk-shape-dim' : 'tk-shape';
  }
}

function AnswerShape({
  shape,
  name,
  state,
  dimmedWhenOpen,
  clickable,
  fit,
  onPick,
  onKeyDown,
}: {
  readonly shape: Vorm;
  readonly name: string;
  readonly state: AnswerState;
  readonly dimmedWhenOpen: boolean;
  readonly clickable: boolean;
  readonly fit: ViewFit;
  readonly onPick: () => void;
  readonly onKeyDown: (event: KeyboardEvent<Element>) => void;
}) {
  // Ameland is 72 units long and 16 wide: judged on its long side it looks like
  // a comfortable target, and a finger disagrees. Anything too narrow to land on
  // gets a circle it can actually be hit with.
  const help = clickable ? helpTargetFor(shape.bbox, fit, shape.punt) : null;
  const pathIsTheTarget = clickable && help === null;

  return (
    <g>
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

  const fill =
    state === 'target'
      ? 'var(--good)'
      : state === 'wrong'
        ? 'var(--bad)'
        : state === 'asked'
          ? 'var(--topo-tint)'
          : 'var(--paper)';
  const stroke =
    state === 'target'
      ? 'var(--good)'
      : state === 'wrong'
        ? 'var(--bad)'
        : state === 'asked'
          ? 'var(--topo)'
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
