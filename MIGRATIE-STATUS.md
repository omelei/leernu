# Migratiestatus

De huisstijl uit `design_handoff_leernu/` (buiten de repo, in `topo-prive/Leveringsvorm en huisstijl v2/`) wordt stap voor stap ingebouwd. Dit bestand houdt bij waar dat staat.

## 1. De primaire tokenlaag

`src/index.css`, met `tailwind.config.ts` als de vertaling naar klassen.

- `src/index.css` is het enige bestand dat een kleur mag noemen. De lintregel in `eslint.config.js` weigert een hex in TS en TSX.
- `src/design/contrast.test.ts` leest dit bestand en meet de kleurparen erin.
- Componenten lezen een token als Tailwind-klasse (`bg-paper`, `text-h1`) of via `var()` in de `tk-*`-regels van hetzelfde bestand.

Er komt geen tweede tokenbestand. De teruggedraaide huisstijl v2 zette zijn tokens in `src/design/tokens.css`; dat herhalen we niet.

## 2. Stap 1: de tokens staan ernaast

Klaar. Nog niets ingeschakeld.

- In `src/index.css`, onderaan het `:root`-blok: het lichte palet, de donkere set (`--donker-*`), de twee fontfamilies, de typografische schaal voor PO, radius, padding en gaps, de beloningsschaduw en de trefmaten.
- Archivo (600, 700) en Public Sans (400, 600) staan als `@font-face` klaar, uit `public/fonts/` op ons eigen domein. Geen regel vraagt om die families, dus geen browser haalt ze op.
- In `tailwind.config.ts` een klasse per token. De naam volgt het token: `bg-kaart`, `text-tekst-secundair`, `text-paginakop`, `font-kop`, `rounded-kaart`, `h-touch-duim`, `drop-shadow-beloning`.
- Geen bestaand token is gewijzigd of verwijderd, en geen component of regel leest een nieuw token.

## 3. Oud token → nieuw token

"Vervalt" betekent: de README-tabel heeft er geen tegenhanger voor. Het oude token blijft staan tot de laatste component die het leest is omgezet.

### Kleur

| Oud                                                   | Nieuw               | Toelichting                                                              |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `--paper`                                             | `--kaart`           | kaart en paneel; `body` staat nu op `--paper`, straks op `--papier`      |
| `--grond`                                             | `--papier`          | de grond van een scherm                                                  |
| `--surface`                                           | vervalt             | ook `--map-land` las hem                                                 |
| `--sunken`                                            | vervalt             | geen tegenhanger in de tokentabel                                        |
| `--line`                                              | `--rand-licht`      |                                                                          |
| `--line-strong`                                       | `--rand-sterk`      | het schermkader                                                          |
| `--ink`                                               | `--inkt`            |                                                                          |
| `--ink-2`                                             | `--tekst-secundair` |                                                                          |
| `--ink-3`                                             | `--tekst-tertiair`  | wordt een tekstkleur: 5,15:1 op kaart, 4,58:1 op papier                  |
| `--good`                                              | `--nadruk`          | goed en nadruk zijn in de overdracht één groen                           |
| `--good-text`                                         | `--nadruk-tekst`    | op `--nadruk-vlak`                                                       |
| `--bad`                                               | vervalt             | fout op licht staat niet in de tokentabel — open punt 2                  |
| `--attention`, `--attention-text`                     | vervalt             |                                                                          |
| `--neutral`                                           | vervalt             |                                                                          |
| `--accent`                                            | `--nadruk`          | als de module-accenten vervallen — open punt 3                           |
| `--accent-tint`                                       | `--nadruk-vlak`     | idem                                                                     |
| `--accent-text`                                       | `--nadruk-tekst`    | idem                                                                     |
| `--accent-soft`                                       | vervalt             |                                                                          |
| `--topo` … `--vlaggen`, met `-text`, `-tint`, `-soft` | vervalt             | geen module-accenten in de tokentabel — open punt 3                      |
| `--reeks-*`, met `-diep`, `-zacht` en `--reeks-licht` | vervalt             | geen tegenhanger, maar de vijf materialen blijven — open punt 4          |
| `--map-land`                                          | `--donker-land`     | alleen de kaart in een ronde; een licht landvlak staat niet in de README |
| `--map-water`                                         | vervalt             |                                                                          |
| `--scrim`                                             | vervalt             |                                                                          |
| donker thema via `prefers-color-scheme`               | vervalt             | de donkere set heet `--donker-*` en volgt de ronde, niet het systeem     |
| —                                                     | `--canvas`          | nieuw: buiten het scherm                                                 |

### Typografie

| Oud                                | Nieuw                                | Toelichting                             |
| ---------------------------------- | ------------------------------------ | --------------------------------------- |
| `'Source Sans 3'` (`font-sans`)    | `--font-tekst` (`font-tekst`)        | Public Sans 400 en 600                  |
| `'Space Grotesk'` (`font-display`) | `--font-kop` (`font-kop`)            | Archivo 600 en 700                      |
| `'IBM Plex Mono'` (`font-mono`)    | vervalt                              | het label boven een vlak is Public Sans |
| `--type-score`                     | `--type-getal`, `--type-getal-groot` | 44 of 48 in plaats van 60               |
| `--type-h1`                        | `--type-paginakop`                   | 40/44                                   |
| `--type-h2`                        | `--type-sectiekop`                   | 28/34                                   |
| `--type-h3`                        | `--type-kaartkop`                    | 20/26                                   |
| `--type-body`                      | `--type-lopend`                      | 20/32 wordt 16/26                       |
| `--type-label`                     | `--type-knop`                        | 17/24, gelijk                           |
| `--type-small`                     | `--type-bijschrift`                  | 14/20                                   |
| `text-eyebrow` (alleen Tailwind)   | `--type-vlaklabel`                   | 11 mono wordt 13 Public Sans 600        |
| —                                  | `--type-vraag`                       | nieuw: de vraag in een ronde, 32/36     |

### Radius

| Oud                              | Nieuw                                           | Toelichting                                         |
| -------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| `--radius-flat`                  | vervalt                                         |                                                     |
| `--radius-field`                 | vervalt                                         |                                                     |
| `--radius-control`               | vervalt                                         | knop en melding hebben geen radius in de tokentabel |
| `--radius-card`, `--card-radius` | `--radius-kaart` (PO), `--radius-kaart-vo` (VO) | 12 en 10                                            |
| `--radius-full`                  | vervalt                                         | de punt blijft rond (`50%`); dat is geen token      |
| `--radius-plaat`                 | vervalt                                         |                                                     |
| `--radius-klein`                 | vervalt                                         |                                                     |
| `--radius-balk`                  | vervalt                                         |                                                     |
| —                                | `--radius-chip`, `--radius-chip-groot`          | nieuw: 6 en 8                                       |
| —                                | `--radius-kaart-telefoon`                       | nieuw: 14                                           |
| —                                | `--radius-rondevlak`                            | nieuw: 16, een vlak in een ronde                    |
| —                                | `--radius-notitieblok`                          | nieuw: 20 — open punt 6                             |

### Ruimte

| Oud              | Nieuw                                             | Toelichting                                                             |
| ---------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `--card-padding` | `--padding-kaart` (PO), `--padding-kaart-vo` (VO) | 24 en 16                                                                |
| `--row-gap`      | vervalt                                           | binnen een kaart: `--gap-kaart-ruim`, `--gap-kaart`, `--gap-kaart-krap` |
| —                | `--padding-paneel`                                | nieuw: 32                                                               |
| —                | `--padding-kaart-telefoon`                        | nieuw: 20 — open punt 5                                                 |
| —                | `--padding-scherm`                                | nieuw: 32, op een telefoon 16                                           |
| —                | `--gap-sectie`                                    | nieuw: 64                                                               |

### Lijn en schaduw

| Oud                                         | Nieuw                | Toelichting                                            |
| ------------------------------------------- | -------------------- | ------------------------------------------------------ |
| `--stroke-hair`                             | `--stroke-hair`      | blijft: 1 px                                           |
| `--stroke-active`                           | `--stroke-active`    | blijft: 2 px bij nadruk of een gekozen staat           |
| `--stroke-region`                           | vervalt              |                                                        |
| `--stroke-answer`                           | vervalt              | een gekozen staat is 2 px                              |
| `--shadow-held`                             | `--schaduw-beloning` | alleen op een beloningsafbeelding, als `drop-shadow()` |
| `--shadow-1`, `--shadow-2`, `--shadow-menu` | vervalt              | geen schaduw buiten beloningen                         |

### Trefmaten

| Oud                           | Nieuw                                  | Toelichting                         |
| ----------------------------- | -------------------------------------- | ----------------------------------- |
| `--touch-min`                 | `--touch-wijzer`                       | 44, wijzer op desktop               |
| `--touch`, `--control-height` | `--touch-duim` (PO), `--touch-vo` (VO) | 56 en 44                            |
| `--touch-board`               | vervalt                                | het digibord                        |
| —                             | `--touch-tablet`                       | nieuw: 48                           |
| —                             | `--touch-ronde`                        | nieuw: 56, tijdens een ronde altijd |

## 4. Open punten uit stap 1

1. **Accent heet `--nadruk`.** De overdracht noemt het groen "accent", maar `--accent` is hier al het accent van de module (via `data-module`). Twee betekenissen op één naam zou de omzetting stil laten mislukken, dus is het groen genoemd naar wat het doet.
2. **Fout op licht.** De tokentabel geeft alleen fout op donker. Stap 10 tekent in de legenda een lichte arcering (`#C98A8A` op `#F3E3E3`, rand `#9E5F5F`), maar die staat niet in de tabel. Nog geen token.
3. **Module-accenten.** Stap 11 noemt ze identiek in PO en VO, dus ze bestaan nog. De tokentabel geeft ze niet. Tot dat besloten is, blijven `--topo` … `--vlaggen` en `--accent` staan.
4. **De vijf materialen** (`--reeks-*`). De verzameling blijft twaalf helden in vijf materialen, maar de tokentabel heeft er geen kleuren voor. De waarden moeten uit de schermen komen.
5. **Wat de README niet uitschrijft.** "20/16 (kaart telefoon en VO)" is gelezen als 20 op de telefoon en 16 in VO. "44/44 of 48/48" voor een groot getal werd twee tokens. 20 en 10 vallen buiten de spacingschaal van `tailwind.config.ts`, dus padding en gaps hebben alleen een `var()`, geen klasse, net als `--card-padding` nu.
6. **`--radius-notitieblok`** (20) is de radius van het notitieblok náást de schermen in de overdracht, geen onderdeel van het product. Overgenomen omdat de opdracht alle radii vroeg. Vervalt waarschijnlijk.
7. **Contrast.** `--nadruk` haalt als tekst 4,71:1 op kaart maar 4,20:1 op papier, dus op de schermgrond is groene tekst `--nadruk-tekst` (6,63:1). `--tekst-tertiair` haalt op papier 4,58:1, net boven de grens. Deze paren staan nog niet in `contrast.test.ts`; dat hoort bij de stap die ze in gebruik neemt.
8. **Buiten deze stap.** De VO-schaal, de hoofdletters van het label en `text-wrap: pretty` zijn regels, geen waarden, en komen met de componenten. "24 tussen schermen" is de tussenruimte op het overdrachtscanvas en is niet overgenomen.
