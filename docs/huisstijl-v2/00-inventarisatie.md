# Huisstijl v2 — fase 0: inventarisatie en voorstel

Status: vastgesteld op 12 september 2026, branch `huisstijl-v2`.

De opdracht vroeg om na deze fase te stoppen en de twee definities uit §6 voor
te leggen. De opdrachtgever schreef daaronder _ga verder_, en §10 zegt dat ik
bij een waarde die nergens vastligt zelf beslis en dat documenteer. Dat doe ik
hier: de twee definities staan in §4 en §5 met hun onderbouwing en gevolgen, en
ze zijn als ADR-106 en ADR-107 in `docs/DECISIONS.md` opgenomen.

Bron van de overdracht:
`topo-prive/Leveringsvorm en huisstijl v2/design_handoff_leernu/`. Volgorde bij
twijfel: `README.md` > `Stap 2` > `Stap 6` > de bestaande code.

## 1. Wat er nu staat

### Routes

De router is met de hand geschreven (`src/features/shell/routes.ts`), zonder
pakket. Een ronde heeft bewust geen adres; hij wordt gekozen met `screen` in
`App.tsx`.

| Pad | Route | Scherm |
| --- | --- | --- |
| `/` | `home` | `HomeScreen` (voordeur, drie scrollrijen en een eigen kolom) |
| `/onthouden` | `retention` | `RetentionScreen` (K9, tabel met itemstatus) |
| `/jij` | `you` | `ProfileScreen` (K10) |
| `/voortgang`, `/ontdekkingsreis` | `reis` | `ReisScreen` (helden, diploma's, stempels, ladder) |
| `/topografie[/set]` | `module` | `ModuleScreen` |
| `/rekenen[/set]`, `/tafels[/set]` | `module` (tafels) | `ModuleScreen` + `Tafeldiplomas` |
| `/klokkijken[/set]`, `/klok[/set]` | `module` (klok) | `ModuleScreen` |
| `/vlaggen[/set]` | `module` (vlaggen) | `ModuleScreen` + `VlagDiplomas` |
| `/woordjes`, `/spelling`, `/tijdvakken` | `soon` | `ModuleSoon` |
| `/rekenen` met meer dan één gebouwd vak | `category` | `CategoryScreen` (nu onbereikbaar) |
| alles anders | `home` | |

Zonder adres: `ExploreScreen`, `PracticeScreen` + `ResultScreen` (kaart),
`SumScreen`, `KlokScreen`, `VlagScreen`, `VlagExploreScreen`, en de
`ProfileGate` die verschijnt zolang er geen kindprofiel is. In ontwikkeling
bestaat `#componenten` (de `Gallery`).

### Styling

Tailwind 3 met een eigen schaal, plus één groot stylesheet `src/index.css`
(3.366 regels) met alle tokens en ruim tachtig `tk-*`-componentklassen. Een
ESLint-regel verbiedt hexwaarden in `.ts`/`.tsx`; kleur staat daardoor al op
één plek. Wat er wél verspreid staat:

- 87 hexwaarden en 428 pixelwaarden in `index.css`, waarvan het grootste deel
  in componentregels in plaats van in tokens;
- vier fontfamilies (Source Sans 3, Space Grotesk, IBM Plex Mono) die in ruim
  zestig regels bij naam worden genoemd;
- vier arbitraire Tailwind-waarden (`w-[320px]` e.a.) en zestien `style={}`-
  attributen in TSX, vooral voor berekende breedtes;
- een eigen donker thema via `prefers-color-scheme`, niet getekend in de
  overdracht.

### Componenten die er feitelijk zijn

`Button`, `Dot` (de punt als vullend vat, van onderen), `ProgressBar`,
`SpeakButton`, `StatusLabel`, `Heldplaat`, `Sterren`, `RoundMark`, `Wordmark`,
`Brandmark`, `Icon`; in de schermen verder `Blok`, `ScrollRij`, `SideColumn`,
`ToetsenBlok`, `Teller`, `RoundProgress` (bolletjes), `StopButton`, `VakMenu`,
`TopBar`, `Kistkeuze`, `Beloning`, `SterTeller`, `KlokFace`, `Vlag`,
`MapCanvas`.

### Opslag van voortgang en beloningen

Alles in IndexedDB op het apparaat (`src/store/db.ts`, schema versie 4), per
kind. Er is geen server en er verlaat niets het apparaat.

- `progress` — Leitner-toestand per kind per item: bakje 1–5,
  `laatsteReview`, `volgendeReview`, `goedCount`, `foutCount`.
- `sessions`, `attempts` — elke ronde en elk antwoord.
- `streak` — dagstreak met `rustdagen` (tot twee, één per geoefende week),
  schoolvakanties uit `content/vakanties.json`, weekenden tellen niet; op
  dezelfde rij de reeks goede antwoorden.
- `settings` — voorkeuren, en per kind één JSON-rij met de helden
  (`helden:<kindId>`).
- `kindBadges` — stempels en diploma's.
- `profile` — het kind: naam, gekozen held, en nog `niveau`, `xp` en `munten`.

### De leerkern zoals hij nu werkt

Er ligt al meer dan de opdracht veronderstelt:

- **Herhaalsysteem.** Vijf bakjes met intervallen 1, 2, 4, 8 en 21 dagen
  (`game-core/leitner.ts`, ADR-005). Goed schuift één bakje op, fout gaat naar
  bakje 1. Het volgende moment is `nu + interval × 24 uur`. Een ronde is
  ongeveer 70% aan de beurt, 20% nieuw en 10% opfrissen; een fout item komt
  drie vragen later terug. Een markering "controleren" bestaat niet.
- **Retentie.** `game-core/retention.ts` voorspelt per item
  `0,9^(verstreken dagen / interval)` en middelt dat per set. Een nooit
  beantwoord item telt als 0. "Onthouden" in tellingen betekent nu: bakje 5.
- **Antwoordtoestanden.** Vier vormen op de kaart (goed, bijna, fout, gemist)
  met arcering en tekens; `answerStates.test.ts` bewaakt dat ze in grijs uit
  elkaar blijven.
- **Streak.** Dagen tellen, weekend en schoolvakantie breken niets, en een
  gemiste schooldag kost een rustdag in plaats van de streak.
- **Verzameling.** Twaalf helden in vijf reeksen (brons, zilver, goud,
  platina, ultra). Tien goede antwoorden zijn een ster, vijf sterren een kist,
  een kist legt drie helden neer en het kind kiest. Drie dubbele tillen een
  held een reeks hoger (ADR-096 tot en met 098). De zestig dieren van de oude
  ladder zijn bij de eerste lezing al omgezet (`uitLadder`). Wat van het oude
  systeem overblijft, is de niveauladder die er nog naast staat, en XP en
  munten die per ronde worden bijgeschreven.
- **Voorlezen.** Een knop per vraag met de Web Speech API, alleen zichtbaar als
  de browser stemmen heeft; een voorkeur "voorlezen" staat standaard aan.

Per module:

- **Topografie** — zeven kaarten (Nederland in vijf sets, zes werelddelen, de
  wereld), zes manieren (wijs aan, meerkeuze, typen, ontdekken, bliksemronde,
  overleven), een mix en "oefen je fouten". Eigen rondelogica in
  `features/practice/useRound.ts`, typtolerantie met botsingswacht (ADR-017).
- **Rekenen** — tafels, delen, plus en min, keersommen, de Rekenmix, en het
  tafeldiploma (tien sommen foutloos).
- **Klok** — vier stappen, drie manieren, beide richtingen.
- **Vlaggen** — per werelddeel, zoeken en meerkeuze, en het vlaggendiploma
  (twintig vlaggen, negen van de tien goed).

Rekenen, klok en vlaggen delen `features/round/useRoundCore.ts`.

## 2. Wat de overdracht vraagt en wat er ontbreekt

| Onderdeel | Staat er | Ontbreekt of wijkt af |
| --- | --- | --- |
| Tokens en fonts | eigen palet, drie families | het hele palet en beide families |
| Rail met vier bestemmingen | rail met vakken, bovenbalk én tabbalk | één rail, andere labels |
| Donker thema tijdens een ronde | systeemafhankelijk donker | donker als eigenschap van de ronde |
| Punt als retentiemeter | `Dot` als vullend vat, voor meerdere betekenissen | conic-gradient, alleen retentie |
| Ruit als vraagteller | bolletjes | ruiten en teller met voorloopnul |
| Toestandsmodel | vier vormen | drie vormen volgens README, punt bij gemist |
| Beweging bij fout | een `@keyframes`-reis van 140 ms | ruim twee seconden, ease-in-out, spoor |
| Herhaalsysteem | vijf bakjes | "controleren", moment per kalenderdag in Europe/Amsterdam |
| Retentie per set | voorspelling | een definitie die met "9 van 12" samenvalt |
| Streak | rustdagen, schoolvakanties | het woord vriezer, vakantiemodus |
| Verzameling | twaalf helden, vijf materialen | niveauladder weg, back-up en terugdraaipad |
| Kaart | eigen projectie en paden | `provincie_2023.geojson`, trefzone uit oppervlak |

## 3. Opslag: blijft client-side

Voorstel: alles blijft in IndexedDB op het apparaat, per kindprofiel.

Waarom. Er zijn geen accounts en die zijn in deze opdracht buiten scope
(aanmelden, gezinsaccount). Een server zonder accounts kan niemand
herkennen. De bestaande rijvormen zijn al zo gekozen dat accounts later een
upload zijn in plaats van een migratie (ADR-015), en er gaat vandaag niets over
een kind het apparaat uit; dat blijft zo.

Wat erbij komt:

- `ItemState.controleren` — optioneel veld op de bestaande `progress`-rij.
  IndexedDB slaat objecten op, dus een nieuw veld vraagt geen schemaversie; een
  oude rij leest als `false`.
- `StreakRecord.eigenVakanties` — de periodes waarin het kind (of een ouder)
  de vakantiemodus aanzette, met een open eind zolang hij aan staat.
- `settings`: `beloning-v1-kopie:<kindId>` — de kopie van de oude
  beloningsgegevens van vóór de omzetting (fase 7).

De retentiewaarde per set wordt **niet** opgeslagen maar bij het lezen
berekend uit de opgeslagen itemtoestanden. Een opgeslagen percentage en de
bakjes waaruit het volgt, zouden op een dag van elkaar verschillen; zo staat
het ook in `DATAMODEL.md` §9. Vastgelegd is de waarde daarmee wel: ze volgt
deterministisch uit wat er per item bewaard is.

## 4. Definitie 1 — de bakjes en hoe een item verschuift

**Intervallen: 1, 2, 4, 8 en 21 dagen**, zoals ze nu zijn.

**Regels:**

1. Goed in een ronde zonder klok: één bakje op, tot en met 5. Een markering
   "controleren" vervalt.
2. Fout in een ronde zonder klok: terug naar bakje 1. De markering vervalt.
3. Goed onder de klok: één bakje op (README: bevestigt en schuift door).
4. Fout onder de klok: het bakje blijft staan en het item krijgt de markering
   "controleren". Het staat daarmee in de eerstvolgende ronde zonder klok
   vooraan, ongeacht zijn volgende moment.
5. Het volgende moment is **het begin van de kalenderdag in Europe/Amsterdam**,
   _interval_ dagen na de dag van het antwoord. Wie op dinsdag om 16.00 uur een
   item in bakje 2 goed heeft, ziet het donderdag vanaf 00.00 uur terug.

Onderbouwing. De intervallen zijn die van ADR-005 en van het datamodel; ze
veranderen zou de bakjes van elk bestaand kind een andere betekenis geven. Het
ankeren op een kalenderdag is nieuw: met `nu + 24 uur × interval` was een item
dat om 19.00 uur geoefend werd de volgende middag nog niet aan de beurt, en
over de wisseling naar zomer- of wintertijd verschoof het moment een uur. Een
kind leeft in dagen, de streak telt in dagen, en de herhaling doet dat nu ook.
Regels 3 en 4 staan klaar voor de spelvormen met een klok uit stap 8; die
spelvormen zelf worden in deze opdracht niet gebouwd.

Gevolgen. Geen gegevensmigratie: oude `volgendeReview`-waarden blijven geldige
tijdstippen en het nieuwe moment geldt vanaf het eerstvolgende antwoord. Een
item wordt gemiddeld een paar uur eerder aangeboden dan voorheen.

## 5. Definitie 2 — de retentiewaarde die de punt toont

**Een item is onthouden** wanneer het laatste antwoord goed was (bakje 2 of
hoger) en het volgende herhalingsmoment nog niet is aangebroken.

**De retentiewaarde van een set** is het aandeel onthouden items in die set,
afgerond op een heel percentage: `round(100 × onthouden / aantal items)`.

**Op een later moment** (de horizon op de toetskaart: nu, over een week, over
drie weken) is het dezelfde telling met dat moment in plaats van nu — wat je
dan nog onthoudt als je tot die dag niets doet.

**Geen waarde** (en dus geen punt) als de set geen items heeft, of als nog geen
enkel item uit de set ooit is beantwoord.

Onderbouwing. De punt staat op elk scherm naast een telling ("9 / 12
onthouden") en in de bewijsregel "Sofie onthoudt 9 van de 12 provincies". Met
deze definitie zijn punt en telling hetzelfde getal: 9 van 12 is een punt die
voor 75% vol is. De huidige voorspelling (`0,9^(dagen/interval)`) zou naast
"9 / 12" bijvoorbeeld 81% tonen — twee getallen voor één begrip op één kaart.
Bovendien is die voorspelling een aanname die nooit is gemeten, en ze gaf een
item dat zojuist fout was beantwoord een retentie van 100%, omdat het net
herhaald was. De nieuwe definitie volgt alleen uit het schema dat al in één zin
uit te leggen is: _je onthoudt iets totdat het weer aan de beurt is_.

Randgevallen, zoals ze getest worden:

- set zonder items: geen waarde;
- set die nooit is aangeraakt: geen waarde (niet 0%);
- set waarvan alles net goed is beantwoord: 100%;
- set waarvan alles aan de beurt is: 0%, en de punt staat leeg maar zichtbaar.

Gevolgen. De waarde verspringt per heel item in plaats van glijdend; bij een
set van vier items zijn dat stappen van 25%. Dat is eerlijk over wat er
gemeten wordt. De horizon op drie weken is voor een beginnend kind laag,
omdat alleen items in bakje 5 dan nog niet aan de beurt zijn — dat is precies
wat de punt moet laten zien. `countMastered` (bakje 5) verdwijnt als
betekenis van "onthouden"; de stempel "set onthouden" blijft aan bakje 5
gekoppeld en heet in de code voortaan zo.

## 6. Wat moet wijken voor het ontwerp

1. Het palet: zeven gekleurde module-accenten als UI-kleur, de semantische
   kleuren goed/fout/aandacht/neutraal, en het donkere thema via de
   systeeminstelling. Daarvoor in de plaats: het palet uit de README, één
   accentgroen, zeven module-tinten alleen op de identiteitsplaat, en donker
   uitsluitend tijdens een ronde.
2. De fonts Source Sans 3, Space Grotesk en IBM Plex Mono. Daarvoor in de
   plaats Archivo en Public Sans, van Google Fonts gehaald en op het eigen
   domein geserveerd.
3. De navigatie: bestemmingen in de bovenbalk, vakken in de rail, het vakmenu
   onder 1200 en de tabbalk. Daarvoor in de plaats één rail van 88 vanaf 1024
   breed, en onder 1024 een tabbalk van 72, met Vandaag / Oefenen /
   Verzameling / Jij. De vakken verhuizen naar Oefenen (S3).
4. De bestemming Onthouden en het scherm K9 (`/onthouden`). Het adres leidt
   voortaan naar Vandaag.
5. De voordeur met drie scrollrijen en de eigen kolom van vier blokken. Wordt
   S2: toetskaart met horizon, Verder oefenen, de startbalk, Jouw helden en
   Jouw week.
6. De niveauladder, XP en munten in beeld. Sterren en kisten blijven.
7. `Dot` als vullend vat voor retentie, itemstatus én "bijna". Wordt de punt
   (conic-gradient), uitsluitend voor retentie.
8. De bolletjes in de ronde en de teller "×0". Worden ruiten en "07 / 12".
9. "Bijna" als eigen vormtoestand. De README kent drie toestanden; een bijna-
   antwoord krijgt de vorm van fout en het woord "Bijna".
10. Bliksemronde en overleven uit de keuzes, en de schakelaar "tijd meten". Het
    zijn spelvormen met een klok of met levens — buiten scope, en §4.10 van de
    opdracht staat geen tijd in de leerkern toe. De stempels "bliksem-tien" en
    "overleven-vijftien" zijn niet meer te verdienen; wie ze heeft, houdt ze.
11. De knop "Ik weet het niet" in de ronde (bewijsstuk 3 van stap 3).
12. `/voortgang` als pagina met helden, diploma's, stempels en ladder. Wordt de
    Verzameling (S11): helden, kist en materialen. De diploma's blijven op de
    pagina van hun eigen vak.
13. De retentievoorspelling en het volgende moment in etmalen (§4 en §5).
14. Schaduwen op kaarten, menu's en dialogen. Alleen beloningsafbeeldingen
    houden er een.

## 7. Wat ik weglaat omdat het bij buiten-scope-functionaliteit hoort

- S12: de vriendcode (vriendschappen), het keuzeveld "groep" (dat stuurt de
  VO-gedaante), de schakelaar "tijd meten".
- S1: "Al eerder geoefend op dit apparaat?" — het scherm verschijnt alleen op
  een apparaat zonder profiel, dus er is niets om naar terug te gaan.
- S4: de tegels Bliksemronde en Overleven.
- Alles uit stap 4, 5, 8, 9 en 11.

Wat ik laat staan hoewel het ernaar ruikt: "Wissel naar een ander kind" op
S12. Het wisselen tussen kinderen op één apparaat bestaat al (ADR-046) en
beschermt de voortgang van elk kind; het weghalen zou de voortgang van een
tweede kind onbereikbaar maken. Ik bouw er niets bij.

## 8. Tegenspraken binnen de overdracht die ik ben tegengekomen

- **Donker palet.** De README-tabel (grond `#1A201B`, vlak `#252C26`) en stap 3
  (grond `#141815`, papier `#1E241F`) verschillen. De README wint.
- **Gemist.** De README en stap 10 zeggen open vlak, dubbele rand en punt; S7
  in stap 2 zegt open ruit en streeprand, omdat de punt alleen retentie mag
  betekenen. De README wint; de punt bij gemist is een markering op de kaart,
  geen retentiemeter.
- **Beweging.** S7 zegt 140 ms, de README ruim twee seconden. De README wint.
- **Materialen.** Stap 3 noemt malachiet en git; stap 2 en de code brons,
  zilver, goud, platina en ultra. Stap 2 wint.
- **Railnaam.** Stap 2 tekent "Helden" in de tabbalk, stap 3 en de opdracht
  "Verzameling". De opdracht wint.
- **Waarden buiten de README-tabel.** Stap 2 gebruikt kleuren die niet in de
  tabel staan: zeven module-tinten (`#EAFBEC`, `#E8F9FF`, `#FFF5E7`,
  `#F8F3FF`, `#E2FBFC`, `#F8F7E3`, `#FFF4F2`), de ronde-inzet `#E3E0D4`, fout
  op licht `#B0554E` / `#FFE6E2`, en de amber van "bijna". De tinten en de
  foutwaarden neem ik over uit stap 2 — ze zijn getekend, niet door mij
  bedacht. Amber valt weg met "bijna".
- **De vraag in een ronde.** De README zegt 32/36; S5 tot en met S9 zetten de
  vraag op de titelmaat. De README wint; op 393 breed geldt de telefoonstap
  van de titel (24/30), omdat de README daar geen waarde voor geeft.

## 9. Werkwijze die ik afwijk van de opdracht

- **Fase 5 vóór fase 4.** De rail en de kopbalk omlijsten elke pagina. Eerst
  alle pagina's in het oude frame omzetten en daarna het frame vervangen,
  betekent elke pagina twee keer doen. De volgorde van de commits blijft per
  fase herkenbaar.
- **Geen d3.** d3-geo is geen afhankelijkheid, en op deze machine kan npm geen
  pakket installeren. De drie valkuilen uit de README neem ik over in de eigen
  contentpipeline en in `MapCanvas`.
- **Verificatie.** Lint, typecheck, Vitest, Prettier en Playwright draaien
  niet op deze Windows-machine (npm is geblokkeerd). Pure `game-core`-code
  test ik hier met Node; al het andere wordt pas bewezen in CI op de pull
  request. Screenshots komen uit CI.
