import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { fitView, helpTargetFor, keyboardOrder, MIN_TOUCH_PX } from '@/game-core';
import type { GeoSet, PointSet, Vorm } from '@/content/loadGeo';

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
 * - A city is a point, and a point has no size. Each one gets an invisible
 *   circle exactly 48 CSS pixels across, whatever the map is scaled to — which
 *   is why the canvas measures itself rather than assuming a size.
 */

export type MapMode = 'shapes' | 'points';

/**
 * `pick` — the child answers by pointing, so every shape is a control.
 * `show` — the child answers by typing, so the map only highlights what is
 * being asked about and nothing is clickable.
 */
export type MapInteraction = 'pick' | 'show';

export interface MapCanvasProps {
  readonly geo: GeoSet;
  /** Present in points mode: the cities laid over the dimmed provinces. */
  readonly points: PointSet | null;
  readonly mode: MapMode;
  readonly interaction: MapInteraction;
  /** Display name per shape or point id — what a child is taught. */
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

export function MapCanvas(props: MapCanvasProps) {
  const { geo, points, mode, interaction, namesById, targetId, chosenId, revealed, onPick } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const renderedHeight = useRenderedHeight(svgRef);

  const shapes = useMemo(() => keyboardOrder(geo.vormen as Vorm[]), [geo]);
  const [, , viewWidth, viewHeight] = geo.viewBox;
  const fit = fitView(viewHeight, renderedHeight);

  // In points mode the provinces are background: visible, but not answers. In
  // typing mode nothing is an answer, because the answer is typed.
  const shapesAreAnswers = mode === 'shapes' && interaction === 'pick';
  const pointsAreAnswers = mode === 'points' && interaction === 'pick';

  const positionOf = (id: string): readonly [number, number] | null => {
    if (mode === 'points') return points?.punten.find((p) => p.id === id)?.punt ?? null;
    return shapes.find((s) => s.id === id)?.punt ?? null;
  };

  const targetPos = positionOf(targetId);
  const chosenPos = chosenId === null ? null : positionOf(chosenId);
  const showTravel =
    revealed && chosenId !== null && chosenId !== targetId && chosenPos !== null && targetPos !== null;

  function handleKey(event: KeyboardEvent<Element>, id: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPick(id);
  }

  function shapeClass(shape: Vorm): string {
    if (mode !== 'shapes') return 'tk-shape-dim';

    if (revealed) {
      if (shape.id === targetId) return 'tk-shape tk-shape-target';
      if (shape.id === chosenId) return 'tk-shape tk-shape-wrong';
      return interaction === 'pick' ? 'tk-shape' : 'tk-shape-dim';
    }

    // While a child is typing, the shape in question is lit and the rest recede.
    if (interaction === 'show') {
      return shape.id === targetId ? 'tk-shape tk-shape-asked' : 'tk-shape-dim';
    }
    return 'tk-shape';
  }

  return (
    <svg
      ref={svgRef}
      viewBox={geo.viewBox.join(' ')}
      className="h-full w-auto max-w-full"
      style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
      role="group"
    >
      <defs>
        {/* The wrong-answer texture: white ground with narrow red stripes at 45
            degrees, faint enough that the shape underneath stays readable. */}
        <pattern id="tk-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="var(--paper)" />
          <rect width="3" height="8" fill="var(--bad)" opacity="0.25" />
        </pattern>
      </defs>

      {shapes.map((shape) => (
        <path
          key={shape.id}
          d={shape.d}
          className={shapeClass(shape)}
          {...(shapesAreAnswers
            ? {
                tabIndex: revealed ? -1 : 0,
                role: 'button',
                'aria-label': namesById.get(shape.id) ?? shape.bronnaam,
                'aria-disabled': revealed,
                onClick: () => !revealed && onPick(shape.id),
                onKeyDown: (event: KeyboardEvent<SVGPathElement>) =>
                  !revealed && handleKey(event, shape.id),
              }
            : { 'aria-hidden': true })}
        />
      ))}

      {mode === 'points' &&
        points?.punten
          .filter((point) => interaction === 'pick' || revealed || point.id === targetId)
          .map((point) => (
          <CityMarker
            key={point.id}
            point={point}
            name={namesById.get(point.id) ?? point.bronnaam}
            state={
              revealed
                ? point.id === targetId
                  ? 'target'
                  : point.id === chosenId
                    ? 'wrong'
                    : 'open'
                : interaction === 'show' && point.id === targetId
                  ? 'asked'
                  : 'open'
            }
            interactive={pointsAreAnswers && !revealed}
            hitRadius={
              helpTargetFor([point.punt[0], point.punt[1], point.punt[0], point.punt[1]], fit)?.r ??
              MIN_TOUCH_PX / 2
            }
            onPick={() => pointsAreAnswers && !revealed && onPick(point.id)}
            onKeyDown={(event) => pointsAreAnswers && !revealed && handleKey(event, point.id)}
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
          /* Below the point, never on it: a name printed over a city dot hides
             the very thing the child is being asked to look at. */
          offsetY={mode === 'points' ? 30 : 26}
        />
      )}
    </svg>
  );
}

function CityMarker({
  point,
  name,
  state,
  interactive,
  hitRadius,
  onPick,
  onKeyDown,
}: {
  readonly point: { readonly id: string; readonly punt: readonly [number, number] };
  readonly name: string;
  readonly state: 'open' | 'target' | 'wrong' | 'asked';
  readonly interactive: boolean;
  readonly hitRadius: number;
  readonly onPick: () => void;
  readonly onKeyDown: (event: KeyboardEvent<Element>) => void;
}) {
  const [x, y] = point.punt;
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
      {/* The ring shows how big the target really is, so a child aiming with a
          finger knows there is more room than the dot suggests. */}
      {interactive && (
      <circle
        cx={x}
        cy={y}
        r={hitRadius * 0.6}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2}
        strokeDasharray="4 4"
        opacity={0.35}
        pointerEvents="none"
      />
      )}
      <circle cx={x} cy={y} r={7} fill={fill} stroke={stroke} strokeWidth={2} pointerEvents="none" />
      {/* The real target: invisible, 48 CSS pixels across at any scale. */}
      {interactive && (
        <circle
          cx={x}
          cy={y}
          r={hitRadius}
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
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="var(--ink)" strokeWidth={3} strokeDasharray="6 6" />
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
      <rect x={x - width / 2} y={top - 14} width={width} height={26} rx={4} fill="var(--paper)" opacity={0.94} />
      <text x={x} y={top + 5} textAnchor="middle" fill="var(--ink)" fontSize={15} fontWeight={700}>
        {text}
      </text>
    </g>
  );
}
