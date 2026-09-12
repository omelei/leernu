# leer.nu — logo

Herziene versie. Het woordbeeld is uitgesneden naar vectorpaden: het logo heeft
geen Archivo-installatie meer nodig en is overal identiek. Het merkteken is een
vat met een dunne wand, verzachte punten en een peil op de helft — de punt in
*leer.nu* heeft hetzelfde silhouet.

## Kleuren
| naam | waarde | gebruik |
| --- | --- | --- |
| inkt | `#1A201B` | op papier en grond (licht thema) |
| papier | `#FBFAF6` | op inkt (ronde/donker thema) |
| accent | `#327F48` | alleen merkteken, spaarzaam |

## Welk bestand wanneer
| bestand | gebruik |
| --- | --- |
| `svg/lockup-inkt.svg` · `-papier` | standaard logo: het vat staat tussen *leer* en *nu* (gelijk aan `woordbeeld-*`) |
| `svg/lockup-gestapeld-*.svg` | smalle of vierkante vlakken; vat groot erboven, in de naam dan een massieve punt |
| `svg/woordbeeld-*.svg` | idem horizontaal |
| `svg/merkteken-*.svg` | vat vanaf 24 px |
| `svg/merkteken-klein-*.svg` | massief, onder 24 px (wand valt anders dicht) |
| `svg/favicon.svg` | favicon, wisselt mee met systeemthema |
| `svg/app-icoon.svg` | squircle, voor app-stores en marketing |
| `svg/app-icoon-vierkant.svg` | bron voor iOS/PWA-rasters |
| `svg/app-icoon-maskable.svg` | Android maskable, motief op 42% |
| `svg/social-kaart.svg` | og:image, 1200 × 630 |
| `png/*` | waar SVG niet kan: favicons, app-iconen, social |

## Regels
- **Vrije ruimte**: minimaal een halve ruitbreedte rondom, aan alle zijden.
- **Minimummaten**: lockup 26 px hoog (print 10 mm) — daaronder loopt het peil in
  het vat tussen de woorden dicht; merkteken los 24 px, daaronder de massieve
  variant.
- **Verhoudingen niet aanpassen**: hoogte zetten, breedte volgt.
- **Niet doen**: schaduw, gradiënt, omlijning, kantelen, het woordbeeld in
  Archivo natypen, het vat vullen met een ander peil dan de helft
  (voortgang toont de app met `Dot`, niet met het logo).
- Op foto's of drukke vlakken: papier-variant op een inktvlak, nooit direct.

## Verantwoording
Woordbeeld: eigen tekening, x-hoogte 100, stam 23, superellips-rondingen
(n = 2,7) met overshoot 2 op ronde vormen; open apertuur in de `e` met
horizontaal afsnit. Merkteken: ruit van 96 met wand 6, punten verzacht met
radius 8, peil op de helft met 3 marge binnen de wand.
