import { Button } from '@/components/Button';
import { Dot } from '@/components/Dot';
import { FreezerIcon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusLabel } from '@/components/StatusLabel';
import { Wordmark } from '@/components/Wordmark';

/**
 * Every component in every state, on one page.
 *
 * Development only. It is imported behind `import.meta.env.DEV`, which Vite
 * replaces with a literal at build time, so the whole tree — this file and
 * everything it pulls in that nothing else uses — is dropped from the
 * production bundle rather than merely hidden in it. A gallery that shipped
 * would be a second interface to keep working, and the first thing a child
 * would find by accident.
 *
 * The point is not to look at it. It is that a state which cannot be rendered
 * here does not exist, and a state that exists but is not here has never been
 * looked at — which for hover, disabled and busy is otherwise the normal case.
 */

const HEADING = 'tk-label mt-8 mb-3';
const ROW = 'flex flex-wrap items-center gap-4';

export function Gallery() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col p-6">
      <h1 className="tk-display text-h1 font-semibold">Componenten</h1>
      <p className="mt-2 text-ink-2">Alleen in ontwikkeling. Elke component in elke toestand.</p>

      <h2 className={HEADING}>Merk</h2>
      <div className={ROW}>
        <Wordmark size={40} clearSpace={false} />
        <Wordmark size={28} clearSpace={false} path="topo" />
      </div>
      <div className="mt-4 flex items-center gap-4 bg-ink p-4">
        <Wordmark size={28} tone="paper" clearSpace={false} />
      </div>

      <h2 className={HEADING}>De punt</h2>
      <div className={ROW}>
        {[96, 32, 24, 20, 16, 12].map((size) => (
          <Dot key={size} size={size} fill={0.62} />
        ))}
      </div>
      <div className={`${ROW} mt-4`}>
        {[0, 0.25, 0.5, 0.75, 1].map((fill) => (
          <Dot key={fill} size={40} fill={fill} />
        ))}
      </div>

      <h2 className={HEADING}>Knop — primair, secundair, tertiair</h2>
      {(['primary', 'secondary', 'tertiary'] as const).map((variant) => (
        <div key={variant} className={`${ROW} mb-3`}>
          <Button variant={variant}>Rust</Button>
          {/* Hover and focus are not props. Hover it, and tab to it — which is
              also the only way to check that the focus ring survives on a
              control whose own background is nearly ink. */}
          <Button variant={variant}>Hover mij</Button>
          <Button variant={variant} disabled>Uit</Button>
          <Button variant={variant} busy>Bezig</Button>
        </div>
      ))}

      <h2 className={HEADING}>Chip en pill</h2>
      <div className={ROW}>
        <button type="button" className="tk-chip">Chip</button>
        <button type="button" className="tk-chip" aria-pressed="true">Chip aan</button>
        <button type="button" className="tk-chip" disabled>Chip uit</button>
        <button type="button" className="tk-pill">Pill</button>
        <button type="button" className="tk-pill" aria-pressed="true">Pill aan</button>
      </div>

      <h2 className={HEADING}>Invoerveld</h2>
      <div className="flex flex-col gap-3">
        <input className="tk-input" placeholder="Rust" />
        <input className="tk-input" placeholder="Fout" aria-invalid="true" />
        <input className="tk-input" placeholder="Uit" disabled />
      </div>

      <h2 className={HEADING}>Kaart en module-ingang</h2>
      <div className="tk-card">Een kaart. Hoekstraal en binnenmarge volgen de gedaante.</div>
      <div className="tk-card tk-card-accented mt-3">
        Toetsdatumblok: het enige blok met een vlak én een rand.
      </div>
      <button type="button" className="tk-module-card mt-3">
        <Dot size={24} fill={0.4} />
        Topografie
      </button>
      <button type="button" className="tk-module-card mt-3" disabled>
        <Dot size={24} fill={0} />
        Nog niet beschikbaar
      </button>

      <h2 className={HEADING}>Voortgang</h2>
      <ProgressBar value={0} label="Leeg" />
      <ProgressBar value={0.35} label="Ruim een derde" className="mt-3" />
      <ProgressBar value={1} label="Vol" className="mt-3" />

      <h2 className={HEADING}>Itemstatus — label, geen chip</h2>
      <div className="flex flex-col gap-2">
        <StatusLabel status="frozen" />
        <StatusLabel status="remembered" />
        <StatusLabel status="practising" />
        <StatusLabel status="new" />
      </div>

      <h2 className={HEADING}>Tabel</h2>
      <table className="tk-table">
        <thead>
          <tr>
            <th>Provincie</th>
            <th className="tk-num">Goed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Groningen</td>
            <td className="tk-num">1.104</td>
            <td>
              <StatusLabel status="remembered" />
            </td>
          </tr>
          <tr>
            <td>Fryslân</td>
            <td className="tk-num">9</td>
            <td>
              <StatusLabel status="practising" />
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className={HEADING}>Dialoog, dekvlak en onderpaneel</h2>
      {/* The scrim and the sheet fill whatever is positioned around them, so a
          demonstration is a box rather than a takeover of the page. */}
      <div className="relative h-24 overflow-hidden border border-line">
        <div className="p-4 text-ink-2">De pagina eronder.</div>
        <div className="tk-scrim" />
        <div className="tk-sheet">
          <p className="tk-display text-h3 font-semibold">Onderpaneel</p>
          <p className="mt-2 text-ink-2">Schaduw 2, op een dekvlak van inkt op 45%.</p>
        </div>
      </div>
      <div className="tk-dialog mt-3">
        <p className="tk-display text-h3 font-semibold">Een dialoog</p>
        <p className="mt-2 text-ink-2">Zelfde gewicht, midden op het scherm.</p>
      </div>

      <h2 className={HEADING}>Kopbalk, rail en tabbalk</h2>
      <div className="tk-appbar">
        <Wordmark size={24} clearSpace={false} />
      </div>
      <div className="mt-3 flex">
        <div className="tk-rail">
          <button type="button" className="tk-tabbar-item" aria-current="page">
            <FreezerIcon size={24} />
            Topo
          </button>
        </div>
        <div className="flex-1 p-4 text-ink-2">Rail 88 breed.</div>
      </div>
      {/* On a tablet the rail lies down: a bar of 72 with 88x56 targets. */}
      <div className="tk-rail tk-rail-bar mt-3">
        <button type="button" className="tk-tabbar-item" aria-current="page">
          <FreezerIcon size={24} />
          Topo
        </button>
      </div>

      <div className="tk-tabbar mt-3">
        {['Vandaag', 'Onthouden', 'Vrienden', 'Jij'].map((item, index) => (
          <button
            key={item}
            type="button"
            className="tk-tabbar-item"
            aria-current={index === 0 ? 'page' : undefined}
          >
            {item}
          </button>
        ))}
      </div>
    </main>
  );
}
