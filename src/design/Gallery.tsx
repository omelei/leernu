import { useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import {
  AntwoordKnop,
  Chip,
  Dialoog,
  Foutmelding,
  HeldTegel,
  IcoonKnop,
  Kaart,
  KistTegel,
  Label,
  Laden,
  LegePlek,
  Lijst,
  Logo,
  Materialen,
  Merkteken,
  PaginaKop,
  Plaat,
  PUNT_MATEN,
  Punt,
  Rij,
  Ruiten,
  Schakelaar,
  SectieKop,
  Teken,
  Teller,
  Tegel,
  Veld,
} from '@/components/ds';
import {
  AreaIcon,
  ClockIcon,
  JijIcon,
  OefenenIcon,
  StopIcon,
  TablesIcon,
  VandaagIcon,
  VerzamelingIcon,
  VoorleesIcon,
} from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';

/**
 * Every component of the set in every state, on one page — stap 6's
 * componentset, in the order stap 2 introduces them, and each in both themes
 * where it appears in a round.
 *
 * Development only. It is imported behind `import.meta.env.DEV`, which Vite
 * replaces with a literal at build time, so this file and everything only it
 * uses is dropped from the production bundle rather than hidden in it.
 *
 * The point is not to look at it. It is that a state which cannot be rendered
 * here does not exist, and a state that exists but is not here has never been
 * looked at — which for hover, disabled and busy is otherwise the normal case.
 */

function Blok({ titel, children }: { readonly titel: string; readonly children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="ln-label mt-8">{titel}</h2>
      {children}
    </section>
  );
}

const ROW = 'flex flex-wrap items-center gap-4';

export function Gallery() {
  const [aan, setAan] = useState(true);
  const [dialoog, setDialoog] = useState(false);

  return (
    <main className="mx-auto flex max-w-3xl flex-col bg-grond p-6">
      <PaginaKop
        titel="Componenten"
        meta="Alleen in ontwikkeling. Elke component in elke toestand."
      />

      <Blok titel="Merk — lockup en merkteken">
        <div className={ROW}>
          <Logo hoogte={44} />
          <Logo hoogte={20} />
          <Merkteken maat={32} />
        </div>
      </Blok>

      <Blok titel="De punt — retentie, zeven maten">
        <div className={ROW}>
          {PUNT_MATEN.map((maat) => (
            <Punt key={maat} procent={62} maat={maat} />
          ))}
        </div>
        <div className={ROW}>
          {[0, 25, 50, 75, 100].map((procent) => (
            <Punt key={procent} procent={procent} maat={40} />
          ))}
          <span className="ln-sub">Geen waarde, geen punt:</span>
          <Punt procent={null} />
        </div>
      </Blok>

      <Blok titel="Knop — primair, secundair, tertiair">
        {(['primary', 'secondary', 'tertiary'] as const).map((variant) => (
          <div key={variant} className={ROW}>
            <Button variant={variant}>Rust</Button>
            <Button variant={variant} disabled>
              Uit
            </Button>
            <Button variant={variant} busy>
              Bezig
            </Button>
          </div>
        ))}
      </Blok>

      <Blok titel="Kaart, plaat, tegel">
        <Kaart>
          <p className="ln-titel">Toets topografie op woensdag 23 september</p>
          <p className="ln-sub">Provincies van Nederland · nog acht dagen</p>
        </Kaart>
        <div className={ROW}>
          <Plaat Icoon={AreaIcon} module="topo" />
          <Plaat Icoon={TablesIcon} module="tafels" />
          <Plaat Icoon={ClockIcon} module="klok" />
          <Plaat leeg />
        </div>
        <div className="ln-tegels">
          <Tegel titel="Provincies" sub="Gekozen · 12 items" gekozen />
          <Tegel titel="Hoofdsteden" sub="12 items" gekozen={false} />
        </div>
      </Blok>

      <Blok titel="Lijst en rij">
        <Lijst>
          <Rij
            titel="Provincies"
            sub="Gisteren geoefend"
            plaat={<Plaat Icoon={AreaIcon} module="topo" />}
            einde={<span className="ln-getal">9 / 12</span>}
            onClick={() => undefined}
          />
          <Rij
            titel="Tafel van 7"
            sub="Diploma nog niet gehaald"
            plaat={<Plaat Icoon={TablesIcon} module="tafels" />}
            einde={<Chip>3 diploma’s</Chip>}
          />
        </Lijst>
      </Blok>

      <Blok titel="Kop, label, invoerveld">
        <PaginaKop titel="Kies je ronde" meta="Nederland · vijf sets" soort="ding" />
        <SectieKop titel="Verder oefenen" actie={<Button variant="tertiary">Alles</Button>} />
        <Label>Je naam</Label>
        <Veld label="Je naam" placeholder="Rust" />
        <Veld label="Je naam" placeholder="Fout" fout="Vul minstens twee letters in." />
        <Veld label="Je naam" placeholder="Uit" disabled />
      </Blok>

      <Blok titel="Statuslabel">
        <div className={ROW}>
          <Chip>brons</Chip>
          <Chip toon="sterk">zilver · gedragen</Chip>
          <Chip toon="accent">Open nu</Chip>
        </div>
      </Blok>

      <Blok titel="Voortgangsbalk">
        <ProgressBar value={0} label="Leeg" />
        <ProgressBar value={0.35} label="Ruim een derde" />
        <ProgressBar value={1} label="Vol" />
      </Blok>

      <Blok titel="De ronde — licht en donker">
        {(['licht', 'ronde'] as const).map((thema) => (
          <div
            key={thema}
            data-thema={thema === 'ronde' ? 'ronde' : undefined}
            className="flex flex-col gap-3 rounded-surface bg-grond p-4"
          >
            <div className={ROW}>
              <IcoonKnop label="Stoppen">
                <StopIcon size={22} />
              </IcoonKnop>
              <Teller huidig={7} totaal={12} />
              <IcoonKnop label="Voorlezen">
                <VoorleesIcon size={22} />
              </IcoonKnop>
            </div>
            <Ruiten beantwoord={6} totaal={12} />
            <ul className="ln-antwoorden">
              <li>
                <AntwoordKnop>Groningen</AntwoordKnop>
              </li>
              <li>
                <AntwoordKnop toestand="goed">Fryslân</AntwoordKnop>
              </li>
              <li>
                <AntwoordKnop toestand="fout">Drenthe</AntwoordKnop>
              </li>
              <li>
                <AntwoordKnop toestand="gemist">Overijssel</AntwoordKnop>
              </li>
            </ul>
            <div className={ROW}>
              <Teken toestand="goed" />
              <Teken toestand="fout" />
              <Teken toestand="gemist" />
              <Button>Volgende</Button>
            </div>
          </div>
        ))}
        {/* The same three in grey: shape must carry them without colour. */}
        <ul className="ln-antwoorden" style={{ filter: 'grayscale(1)' }}>
          <li>
            <AntwoordKnop toestand="goed">Goed in grijs</AntwoordKnop>
          </li>
          <li>
            <AntwoordKnop toestand="fout">Fout in grijs</AntwoordKnop>
          </li>
          <li>
            <AntwoordKnop toestand="gemist">Gemist in grijs</AntwoordKnop>
          </li>
        </ul>
      </Blok>

      <Blok titel="Schakelaar">
        <Lijst>
          <li>
            <Schakelaar
              titel="Vragen voorlezen"
              uitleg="Je kunt elke vraag laten voorlezen."
              aan={aan}
              onWissel={setAan}
            />
          </li>
        </Lijst>
      </Blok>

      <Blok titel="Dialoog, laden, foutmelding">
        <div className={ROW}>
          <Button variant="secondary" onClick={() => setDialoog(true)}>
            Open de dialoog
          </Button>
          <Laden label="Even geduld" />
        </div>
        {dialoog ? (
          <Dialoog
            titel="Ronde afbreken?"
            onSluit={() => setDialoog(false)}
            knoppen={
              <>
                <Button onClick={() => setDialoog(false)}>Afbreken</Button>
                <Button variant="secondary" onClick={() => setDialoog(false)}>
                  Verder oefenen
                </Button>
              </>
            }
          >
            Je zes goede antwoorden blijven bewaard.
          </Dialoog>
        ) : null}
        <Foutmelding titel="De kaart kwam niet binnen">
          Je antwoorden staan lokaal klaar. Probeer het zo nog eens.
        </Foutmelding>
      </Blok>

      <Blok titel="Heldkaart, kist, lege plek, materialen">
        <ul className="ln-helden">
          <li>
            <HeldTegel sticker="valerie" reeks="zilver" gedragen onKies={() => undefined} />
          </li>
          <li>
            <HeldTegel sticker="daan" reeks="brons" gedragen={false} onKies={() => undefined} />
          </li>
          <li>
            <KistTegel onOpen={() => undefined} />
          </li>
          <li>
            <LegePlek />
          </li>
        </ul>
        <Materialen />
      </Blok>

      <Blok titel="Navigatie — de vier bestemmingen">
        <div className={ROW}>
          <VandaagIcon />
          <OefenenIcon />
          <VerzamelingIcon />
          <JijIcon />
        </div>
      </Blok>
    </main>
  );
}
