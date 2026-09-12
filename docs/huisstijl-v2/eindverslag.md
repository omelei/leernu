# Huisstijl v2 — eindverslag

Het ontwerp van leer.nu is doorgevoerd op de branch `huisstijl-v2` (PR #31):
de huisstijl op alle pagina's, de ontbrekende leerkern en één rail met vier
bestemmingen. Dit verslag zegt per laag en per pagina wat er veranderde, legt
de twee definities vast die de opdracht vroeg, en noemt eerlijk wat moest
wijken, wat is weggelaten en wat nog openstaat. De inventarisatie van fase 0
staat in [`00-inventarisatie.md`](00-inventarisatie.md); de besluiten staan
als ADR-106 en ADR-107 in [`../DECISIONS.md`](../DECISIONS.md).

## Werkwijze en fasen

Eén commit per fase, en binnen fase 4 één per pagina. Na elke fase draaide de
volledige CI (typecheck, lint, unittests, e2e op zes schermmaten, Lighthouse,
schermafdrukken). Waar een fase in CI brak, volgt direct een herstelcommit
met dezelfde fasenaam.

| Fase | Wat                                             | Commits (eerste → herstel) |
| ---- | ----------------------------------------------- | -------------------------- |
| 0    | Inventarisatie en de twee definities            | c238344                    |
| 1    | Tokens (`src/design/tokens.css`)                | c01bfb3                    |
| 2    | Componentset (`src/components/ds/`)             | 415b212                    |
| 3    | Leerkern, met tests                             | bf6d00e → 841c25d          |
| 5    | Rail en de vier bestemmingen                    | 1f5dc75                    |
| 4    | Vandaag                                         | bcfe982 → 614ab57          |
| 4    | /topografie en de andere modulepagina's (S4)    | b290e53 → ee8f618          |
| 4    | De ronde (S5–S9), alle vier de modules          | b15b6b1 → 2e35ef1          |
| 4    | De uitslag (S10)                                | 0417fc6                    |
| 4    | Startscherm (S1), "bestaat nog niet", categorie | b8198ad → 5943891          |
| 4    | Ontdekken, beloning, diplomamuren               | d234503                    |
| 6    | De kaart op `provincie_2023`                    | d6b1343 → 41ff2ea          |
| 7    | Omzetting van de oude beloningen                | 5819882                    |
| 8    | Controle, opruimen en dit verslag               | (deze commit)              |

Fase 5 kwam vóór fase 4: rail en kopbalk omlijsten elke pagina, en eerst elke
pagina in het oude frame omzetten om daarna het frame te vervangen, was elke
pagina twee keer doen (inventarisatie §9).

## Wat er veranderde, per laag

### Tokens

`src/design/tokens.css` is de enige plek voor waarden: het palet van de README
(licht, en donker onder `[data-thema='ronde']`), Archivo en Public Sans op het
eigen domein, de typeschaal, radii, lijndiktes, afstanden en de raakmaten
44 / 48 / 56 (in een ronde altijd 56). De zeven moduletinten staan alleen op
de identiteitsplaat. In TypeScript staat geen hexwaarde (ESLint), en buiten
`tokens.css` staat er ook in CSS geen. Het blok met oude namen onderaan is
teruggebracht tot wat nog in gebruik is (zie "Wat blijft staan").

### Componentset

`src/components/ds/` volgt de nummering van stap 6: punt, ruiten en teller,
de drie antwoordtoestanden (goed, fout, gemist) met hun tekens, kaart, plaat,
tegel, lijst en rij, paginakop en sectiekop, label, chip, invoerveld, laden,
foutmelding, icoonknop, schakelaar, dialoog, de verzamelingstegels en het
logo. Knoppen: één primair, secundair en tertiair (`Button.tsx`).

### Leerkern (`src/game-core/`)

- **Leitner, vijf bakjes**, met een volgend moment en de markering
  "controleren" (ADR-106, zie hieronder). Dagen in Europe/Amsterdam
  (`kalender.ts`), getest over beide zomertijdwissels van 2026.
- **Retentie per set** (ADR-107): de punt, als
  `conic-gradient(var(--accent) 0 X%, var(--rail-empty) X% 100%)`, in de maten
  18 / 22 / 28 / 32 / 40 / 44 / 56. De punt toont alleen retentie; de ruit telt
  vragen.
- **Antwoordtoestanden** (`uitkomst.ts`): goed is een dicht vlak met vinkje,
  fout een arcering van 45° met een periode van 8 px en een kruis, gemist een
  open vlak met dubbele rand en een punt.
- **Uitslag van een ronde** (`rondeUitslag`): nieuw onthouden, opgefrist,
  blijven wisselen — uit de bakjes vóór en na de ronde.
- **Reeks met vriezer en vakantiemodus** (`streak.ts`), in kalenderdagen.
- **Verzameling**: twaalf helden in vijf materialen (brons, zilver, goud,
  platina, ultra).
- **Omzetting van de oude beloningen** (`beloning.ts`, fase 7, hieronder).

### Kader

Eén rail met Vandaag, Oefenen, Verzameling en Jij vanaf 1024 breed, eronder
een tabbalk van 72; de kopbalk met logo (of de module op een modulepagina),
sterren, held en naam. Tijdens een ronde verdwijnt het kader helemaal — niet
gedimd, afwezig — en zet de ronde het donkere thema op de wortel. De uitslag
stapt de ronde weer uit en krijgt het kader terug. Nieuwe adressen alleen voor
de vier bestemmingen; `/voortgang` en `/ontdekkingsreis` leiden naar de
Verzameling, `/onthouden` naar Vandaag.

## Wat er veranderde, per pagina

| Pagina                                       | Scherm  | Wat                                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Startscherm                                  | S1      | "Hoe heet je?" als displaykop direct op de grond, één metaregel, het veld met label erboven en fout eronder, Verder als primaire knop (op de telefoon vast onderaan).                                                                                                                          |
| Vandaag                                      | S2      | Toetskaart met horizon (nu, +7, +21 dagen) in punten, Verder oefenen, de startbalk met één primaire knop, Jouw helden, Jouw week met vriezer en vakantie.                                                                                                                                      |
| Oefenen                                      | S3      | Alle modules als rijen; wat nog niet bestaat gedimd en toch een deur.                                                                                                                                                                                                                          |
| /topografie, /rekenen, /klokkijken, /vlaggen | S4      | "Kies je ronde", één tintvlak achter de genummerde stappen, elke keuze een tegel, Start met de combinatie letterlijk in het label, de oefentoets als tertiaire knop.                                                                                                                           |
| De ronde, vier modules                       | S5–S9   | Vraagbalk (stoppen en voorlezen als icoonknop van 56, de vraag, teller met voorloopnul, ruiten), donker thema, antwoordknoppen met hun toestand na het antwoord, antwoordveld met label, terugkoppeling met het goede antwoord als kop, "Ronde afbreken?" als enige dialoog, Escape opent hem. |
| De kaart                                     | S25–S28 | `provincie_2023`, trefzone uit het oppervlak, focusrand van 3 px gestippeld wit, één beweging van twee seconden na een fout antwoord.                                                                                                                                                          |
| Uitslag                                      | S10     | Kader terug, één kaart met drie rijen (nieuw onthouden, opgefrist, blijven wisselen), score in de metaregel, Nog een ronde als primaire knop.                                                                                                                                                  |
| Verzameling                                  | S11     | Twaalf helden, de kist als keuze, de materialen.                                                                                                                                                                                                                                               |
| Jij                                          | S12     | De gedragen held met Wisselen, voorlezen en vakantiemodus als schakelaar, "Wissel naar een ander kind".                                                                                                                                                                                        |
| Bestaat nog niet, categorie                  | —       | In het paginakader, modules als rijen.                                                                                                                                                                                                                                                         |
| Ontdekken (kaart en vlaggen)                 | —       | Niet getekend in stap 2: de componentset op de bestaande indeling.                                                                                                                                                                                                                             |

## De twee definities

### Definitie 1 — de bakjes (ADR-106)

Intervallen 1, 2, 4, 8 en 21 dagen. Goed zonder klok: één bakje op; fout
zonder klok: terug naar bakje 1; fout onder de klok: het bakje blijft en het
item krijgt "controleren", dat als eerste terugkomt en telt als aan de beurt.
Het volgende moment is **het begin van de kalenderdag in Europe/Amsterdam**,
_interval_ dagen na de dag van het antwoord.

Waarom: de intervallen veranderen zou de bakjes van elk bestaand kind een
andere betekenis geven. Het ankeren op een kalenderdag is nieuw: met
`nu + 24 uur × interval` was een item dat om 19.00 uur geoefend werd de
volgende middag nog niet aan de beurt, en over een tijdwissel verschoof het
een uur. Een kind leeft in dagen, de reeks telt in dagen, en de herhaling doet
dat nu ook. Geen gegevensmigratie: oude momenten blijven geldig.

### Definitie 2 — de retentiewaarde (ADR-107)

Een item is **onthouden** als het laatste antwoord goed was (bakje 2 of hoger)
en het volgende moment nog niet is aangebroken. De retentie van een set is
`round(100 × onthouden / aantal items)`; geen waarde (en geen punt) voor een
set zonder items of een set die nooit is aangeraakt. Op de horizon is het
dezelfde telling op dat moment.

Waarom: de punt staat naast "9 / 12 onthouden", en met deze definitie zijn
punt en telling hetzelfde getal. De oude voorspelling (`0,9^(dagen/interval)`)
gaf een ander getal op dezelfde kaart, was nooit gemeten, en gaf een item dat
net fout was 100%. De nieuwe volgt uit één zin: _je onthoudt iets totdat het
weer aan de beurt is_.

## Wat moest wijken

Uit de inventarisatie (§6), zoals uitgevoerd:

1. Het oude palet, de zeven module-accenten als UI-kleur en het donkere thema
   via de systeeminstelling. Donker is er alleen tijdens een ronde.
2. Source Sans 3, Space Grotesk en IBM Plex Mono.
3. De oude navigatie (bovenbalk, vakken in de rail, vakmenu, tabs).
4. De bestemming Onthouden en K9.
5. De voordeur met drie scrollrijen en de eigen kolom (`SideColumn`,
   `ToetsenBlok`, `Blok` zijn weg; Vandaag draagt toetsen, helden en week).
6. Niveauladder, XP en munten in beeld (ze worden nog wel bijgeschreven).
7. `Dot` als vullend vat; wordt de punt, alleen voor retentie.
8. De bolletjes en "×0" in de ronde; worden ruiten en "07 / 12".
9. "Bijna" als eigen vormtoestand; het is fout met het woord "Bijna".
10. Bliksemronde en overleven uit de keuzes, en de schakelaar "tijd meten".
11. "Ik weet het niet" in de ronde. S5 tekent geen handeling tijdens een vraag.
12. `/voortgang`; wordt de Verzameling.
13. De retentievoorspelling en het moment in etmalen.
14. Schaduwen, behalve op beloningsafbeeldingen.

Bij het bouwen erbij gekomen:

- **Modulepagina (S4):** de regel "Er staan N onderdelen van … op de rol" met
  zijn knop, "Oefen zoals de toets" met het toetslabel, de rij gekozen-chips en
  de minuten in de startbalk, en de eigen kolom naast de pagina. Wat op de rol
  staat en de toets draagt Vandaag.
- **Ronde:** de sterteller, "goed op rij", tijd en levens in de balk. Geen tijd
  of snelheid in de leerkern; de spelvormen zijn buiten bereik.
- **Uitslag:** de kaart met wat je nog moet oefenen (topografie), de lijst met
  sommen, en de klokken en vlaggen die nog moeten. De rij "blijven wisselen"
  noemt ze bij naam.
- **Instructie in de ronde:** "Wijs het land aan" staat niet meer op het
  scherm; de vraag is de kop. Een schermlezer en de voorleesknop zeggen hem.
- **Oefentoets:** was een eigen tegel (ADR-100); is nu een tertiaire knop
  naast Start met zijn stand in woorden, zoals S4 hem tekent.

## Ontwerpelementen die zijn weggelaten

- **S1:** "Al eerder geoefend op dit apparaat?" — één kind per apparaat binnen
  de opdracht; een uitweg die nergens heen leidt, is niet getekend.
- **S3:** de achtste rij "De achtste plek staat open" — een notitie voor wie de
  volgende module bouwt, voor een kind een module die ontbreekt.
- **S4:** het oriëntatiebeeld naast de stappen op 1366, en de "Alle … sets"-
  uitweg op de telefoon (alle tegels staan er al). Pijltjes binnen een
  tegelgroep zijn niet gebouwd; Tab loopt door alle tegels.
- **S6:** de retentie-ruit van→naar in de ronde.
- **S10:** de van→naar-ruit per uitslagrij en het statuslabel "zakt".
- **S12:** de vriendcode, het veld "groep" (VO-gedaante) en "tijd meten".
- **Ontdekken:** niet getekend; de componentset op de bestaande indeling.

## Waar ik afweek van het ontwerp, en waarom

- **De vraag in een ronde** staat op de README-maat (32/36, 24/30 op de
  telefoon), niet op de titelmaat van S5–S9 (inventarisatie §8).
- **Terugkoppeling** ligt op elke maat als strook onder het canvas, ook op 1366
  waar S6 een kaart in het canvas tekent: de kaart blijft dan volledig zichtbaar
  en er is één indeling voor alle maten.
- **Tegels op S4** voor elke keuze, ook voor de twaalf tafels en het aantal
  vragen: S4 kent één selectie-idioom. Op de telefoon is de tafelstap daardoor
  lang; een compacte tegel staat niet in de set.
- **De eerste stap op S4** (waar op de kaart) duwt op 1366×768 "Waarover" onder
  de vouw, waar S4 onderwerp en manier naast elkaar zet. S4 tekent de regio-
  keuze niet; zie open punten.
- **Trefzone van 44** op de kaart (S27), waar de raakmaat van een knop in een
  ronde 56 is. Stap 7 punt 7 noemt beide; de kaart volgt stap 10.
- **De omhullende** blijft de maat voor lagen zonder oppervlak (eilanden,
  landen). Alleen de provincies dragen hun oppervlak.

## Openstaande besluiten uit stap 7 die ik tegenkwam

| Stap 7  | Wat                                          | Wat ik deed                                                                                             |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1       | Punt als retentiemeter, ruit als vraagteller | Gevolgd: punt alleen retentie, ruiten tellen vragen.                                                    |
| 7       | Eén tabel 44 / 48 / 56 en de overlapregel    | Knoppen 44 / 48 / 56 (ronde 56); kaart 44 met de kleinste bovenop. De tabel in het plan staat nog open. |
| 8       | Arcering en tekens op goed, fout en gemist   | Gebouwd in knop, kaart en terugkoppeling.                                                               |
| 9       | VO-gedaante                                  | Alleen de tokens (`[data-gedaante='vo']`); niets zet hem aan.                                           |
| 10      | Spelvormen met klok en levens                | Buiten bereik; regels 3 en 4 van ADR-106 staan klaar, overleven is uit de keuzes.                       |
| 11      | 60 dieren worden 12 helden                   | Fase 7: omzetting met kopie en weg terug.                                                               |
| 12      | Tabs, namen, teller met voorloopnul          | Gedaan: één rail, Vandaag / Oefenen / Verzameling / Jij, "07 / 12".                                     |
| 15      | Trefzone uit het oppervlak                   | Gedaan (fase 6); gemeten op 420 hoog: Flevoland 57, Utrecht 58.                                         |
| Vraag 6 | De kaart echt in het product                 | Gedaan: `provincie_2023` in de ronde, beide thema's.                                                    |

Niet aangeraakt omdat ze buiten de opdracht vallen: 2 (klasoverzicht), 3 en 13
(prijs en btw), 4 en 14 (prijspagina en gratis mix), 5 en 6 (kanalen en
prijspagina), en de ontwerpvragen 1 tot en met 5 (klas, verliesmoment,
weekmail, mixscherm, oefenbladen).

## De omzetting van de oude beloningen (fase 7)

De omzetting bestond al: de eerste lezing van de helden zet de dieren van de
oude ladder om (`uitLadder`). Erbij gekomen:

- **Eerst een kopie** van wat het oude systeem had — goede antwoorden, niveau,
  XP, munten en de gedragen held — onder `beloning-v1-kopie:<kindId>` in
  `settings`, één keer; een latere run overschrijft hem nooit.
- **Idempotent:** een kind met helden krijgt niets geschreven, en `uitLadder`
  is deterministisch.
- **Een weg terug:** `terugdraaienBeloning()` in `heldenStore.ts` haalt de
  heldenrij weg, alleen waar het apparaat een kopie heeft. De kopie blijft;
  opnieuw omzetten geeft dezelfde helden. De functie hangt aan geen scherm: ze
  is er voor een release die de omzetting moet terugdraaien.

Getest zonder database (`beloning.test.ts`): kopie vóór helden, tweede run
schrijft niets, bestaande kopie blijft, deterministisch, onleesbare kopie telt
niet, heen-terug-heen.

**Niet uitgevoerd op productiegegevens.** Deze code draait op een apparaat pas
als de branch gedeployd is, en dat gebeurt bij het mergen van PR #31. Die merge
is het akkoord dat de opdracht vraagt.

## Controle

### Tests

In CI groen op 5819882 (en alle latere herstelcommits):

- **Leitner met Europe/Amsterdam en zomertijd:** `kalender.test.ts`,
  `leitner.test.ts` (29 maart en 25 oktober 2026).
- **Retentie en randgevallen:** `retention.test.ts` (geen items, nooit
  aangeraakt, alles net goed, alles aan de beurt, horizon).
- **Materialen:** `helden.test.ts`, `collection.test.ts`.
- **Omzetting idempotent:** `beloning.test.ts`.
- **Kaart:** `map.test.ts` (trefzone uit oppervlak, minimum 44, tekenvolgorde),
  `content.test.ts` (elke provincie raakbaar, één kader voor alle lagen, bron
  en licentie).
- **Rookproef per module:** e2e voor topografie, rekenen, klokkijken en
  vlaggen, op zes maten (Chromebook 1366, desktop 1440, iPad liggend en
  staand, iPhone 14 Pro, Pixel 7), met axe op elk scherm.

### Schermafdrukken

`e2e/screens.spec.ts` legt vijftien schermen vast per maat, als artefact
`screenshots` van elke CI-run: **1366×768** (chromebook), **393×852** (iPhone
14 Pro) en vanaf deze commit **1024×768** (`tablet-1024`, alleen de
schermafdrukken). Licht en donker: elke ronde (05, 06, 08, 09, 11) is donker,
de rest licht — het product kent donker alleen tijdens een ronde.

### Contrast (WCAG, gemeten uit `tokens.css`)

| thema | tekst of rand    | op              | waarden            | verhouding |
| ----- | ---------------- | --------------- | ------------------ | ---------- |
| licht | `--ink`          | `--paper`       | #1a201b op #fbfaf6 | 15,88:1    |
| licht | `--ink`          | `--grond`       | #1a201b op #efede4 | 14,14:1    |
| licht | `--ink-2`        | `--paper`       | #525953 op #fbfaf6 | 6,90:1     |
| licht | `--ink-3`        | `--paper`       | #666c67 op #fbfaf6 | 5,15:1     |
| licht | `--ink-3`        | `--grond`       | #666c67 op #efede4 | 4,58:1     |
| licht | `--accent-text`  | `--accent-tint` | #2c5c3a op #eafbec | 7,23:1     |
| licht | `--accent`       | `--paper`       | #327f48 op #fbfaf6 | 4,71:1     |
| licht | `--on-good`      | `--good`        | #fbfaf6 op #327f48 | 4,71:1     |
| licht | `--bad-text`     | `--paper`       | #b0554e op #fbfaf6 | 4,72:1     |
| licht | `--control-line` | `--paper`       | #666c67 op #fbfaf6 | 5,15:1     |
| ronde | `--ink`          | `--paper`       | #fbfaf6 op #252c26 | 13,71:1    |
| ronde | `--ink`          | `--grond`       | #fbfaf6 op #1a201b | 15,88:1    |
| ronde | `--ink-2`        | `--paper`       | #b9beb9 op #252c26 | 7,59:1     |
| ronde | `--ink-3`        | `--paper`       | #8c948c op #252c26 | 4,59:1     |
| ronde | `--accent`       | `--paper`       | #7fd494 op #252c26 | 8,01:1     |
| ronde | `--bad-text`     | `--paper`       | #f2b8b8 op #252c26 | 8,40:1     |
| ronde | `--line-strong`  | `--paper`       | #7c867d op #252c26 | 3,79:1     |
| ronde | `--map-border`   | `--map-land`    | #7c867d op #2f3831 | 3,21:1     |

Alle tekst haalt 4,5:1, alle randen van bedieningselementen en de kaartgrens
3:1. `--line-strong` op papier in het lichte thema (1,78:1) is decoratie, geen
rand van een bedieningselement; die gebruiken `--control-line`.
`contrast.test.ts` bewaakt deze paren bij elke wijziging.

### Grijswaarden

De schermafdrukken van een fout antwoord (06) op 1366 en 393, met Pillow naar
grijs omgezet: het gemiste antwoord blijft een open vlak met zware rand en
punt, het foute antwoord gearceerd (op 393 leest de arcering bij die schaal
als egaal middengrijs, nog steeds anders dan open), het spoor gestippeld, en de
terugkoppeling draagt een kruis. Geen van de drie toestanden rust op kleur.

### Toetsenbord

In e2e: de kaart is met Tab te bereiken en met Enter te beantwoorden, de focus
springt naar Volgende (`a11y.spec.ts`); Escape opent de onderbreking en sluit
hem met Verder oefenen; de dialoog houdt de focus vast. De focusrand op de
kaart is 3 px gestippeld in inkt (wit op de donkere grond), elders 3 px inkt
met 3 px afstand.

### Restzoektochten

- **Oude hexwaarden** buiten `tokens.css`: geen.
- **Oude fonts:** geen (de laatste vermelding zat in het ongebruikte
  `Wordmark.tsx`, dat in deze commit is verwijderd).
- **"vast", "beheersing", "blijft zitten"** in de copy: geen.
- **Oude tabs:** geen.
- **`tk-*` in TSX:** alleen nog in tekeningen en testhaken, zie hieronder.

## Wat blijft staan

- **`tk-*`-klassen in tekeningen:** de kaart (`MapCanvas`: vormen, zones,
  spoor), de wijzerplaat (`KlokFace`), de vlag en de vlagkeuze, de heldplaat,
  de sterren, de kistkeuze, de diplomamuren, en `.tk-sum` en `.tk-cijfer`,
  waar de e2e op leunt. Het zijn namen van tekeningen, geen pagina's in de oude
  stijl; hernoemen is werk zonder zichtbaar gevolg.
- **Dode CSS is weg:** 127 klassen van de oude pagina's (234 selectors) uit
  `index.css`, dat van 4.626 naar zo'n 2.860 regels ging. Een selector gold als
  dood als hij een `tk-`/`ln-`klasse noemt die nergens in `src` of
  `index.html` voorkomt; klassen uit een sjabloon (`ln-teken-${…}`) tellen als
  gebruikt.
- **Oude kleurnamen zijn weg:** `--surface`, `--sunken`, `--accent-soft` en de
  `--reeks-*`-tinten verwijzen nu rechtstreeks naar het token waar ze al naar
  wezen (dezelfde waarde, niets verandert in beeld), en het aliasblok in
  `tokens.css` en de twee Tailwind-namen zijn verwijderd.

## Open punten

1. Op 1366×768 staat "Waarover" op /topografie onder de vouw door de regiostap.
   S4 tekent onderwerp en manier naast elkaar en de regiokeuze niet.
2. Een compacte tegel voor de tafels en het aantal vragen staat niet in de set.
3. De tabel 44 / 48 / 56 in het plan (stap 7, punt 7).
