import { useMemo, type KeyboardEvent } from 'react';
import { keyboardOrder } from '@/game-core';
import type { GeoSet, Vorm } from '@/content/loadGeo';

/**
 * The map, and the only place the answer is shown.
 *
 * Follows docs/leer.nu oefenkaart.html. Two choices there are worth keeping in
 * mind while reading this:
 *
 * - A correct answer is **outlined** green on paper, not filled. A wrong one is
 *   filled with a **hatch**. Texture rather than colour alone, so the difference
 *   survives colour blindness and a grey printout — which is what spec section 8
 *   asks for and what a map, where colour does nearly all the work, makes hard.
 * - After a wrong answer a dot **travels** from the shape the child pointed at
 *   to the right one. It is the one moment in this product where movement
 *   teaches instead of decorates: the child sees the distance they were out by.
 */

export interface MapCanvasProps {
  readonly geo: GeoSet;
  /** Display name per shape id — what a child is taught, not what the source spells. */
  readonly namesById: ReadonlyMap<string, string>;
  readonly targetShapeId: string;
  readonly chosenShapeId: string | null;
  readonly revealed: boolean;
  readonly onPick: (shapeId: string) => void;
}

function classesFor(shape: Vorm, props: MapCanvasProps): string {
  if (!props.revealed) return 'tk-shape';
  if (shape.id === props.targetShapeId) return 'tk-shape tk-shape-target';
  if (shape.id === props.chosenShapeId) return 'tk-shape tk-shape-wrong';
  return 'tk-shape';
}

export function MapCanvas(props: MapCanvasProps) {
  const { geo, namesById, targetShapeId, chosenShapeId, revealed, onPick } = props;

  // Reading order: north to south, then west to east. Source order is whatever
  // the data provider happened to choose, which for a child on a keyboard is no
  // order at all.
  const shapes = useMemo(() => keyboardOrder(geo.vormen as Vorm[]), [geo]);

  const target = shapes.find((shape) => shape.id === targetShapeId);
  const chosen =
    chosenShapeId === null ? undefined : shapes.find((shape) => shape.id === chosenShapeId);

  // Narrowed here rather than inside the JSX: optional chaining in a condition
  // does not narrow the property for the expression that follows it.
  const travelFrom = chosen?.punt ?? null;
  const travelTo = target?.punt ?? null;
  const showTravel =
    revealed && chosen !== undefined && chosen.id !== targetShapeId && travelFrom !== null && travelTo !== null;

  function handleKey(event: KeyboardEvent<SVGPathElement>, id: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPick(id);
  }

  const [, , viewWidth, viewHeight] = geo.viewBox;

  return (
    <svg
      viewBox={geo.viewBox.join(' ')}
      className="h-full w-auto max-w-full"
      style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
      role="group"
    >
      <defs>
        {/* The wrong-answer texture. White ground with narrow red stripes at 45
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

      {shapes.map((shape) => (
        <path
          key={shape.id}
          d={shape.d}
          className={classesFor(shape, props)}
          tabIndex={revealed ? -1 : 0}
          role="button"
          aria-label={namesById.get(shape.id) ?? shape.bronnaam}
          aria-disabled={revealed}
          onClick={() => !revealed && onPick(shape.id)}
          onKeyDown={(event) => !revealed && handleKey(event, shape.id)}
        />
      ))}

      {/* The journey from the answer given to the answer wanted. Drawn before
          the label so the label stays on top of it. */}
      {showTravel && travelFrom !== null && travelTo !== null && (
        <TravelPath from={travelFrom} to={travelTo} />
      )}

      {revealed && target?.punt && (
        <ShapeLabel
          x={target.punt[0]}
          y={target.punt[1]}
          text={namesById.get(target.id) ?? target.bronnaam}
        />
      )}
    </svg>
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
    <g aria-hidden="true">
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
        r={13}
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

function ShapeLabel({ x, y, text }: { readonly x: number; readonly y: number; readonly text: string }) {
  // A plate behind the name, because a label on a coastline is unreadable
  // without one. Width from the character count: close enough at this size, and
  // it avoids measuring text in the DOM on every render.
  const width = text.length * 9 + 20;

  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect x={x - width / 2} y={y - 14} width={width} height={26} fill="var(--paper)" opacity={0.92} />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        className="font-sans"
        fill="var(--ink)"
        fontSize={15}
        fontWeight={700}
      >
        {text}
      </text>
    </g>
  );
}
