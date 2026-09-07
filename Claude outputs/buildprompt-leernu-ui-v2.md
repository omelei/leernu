# Buildprompt — leer.nu UI v2

**Voor:** Claude Code, werkend in de repository `topo` (leer.nu).
**Type:** ontwikkelopdracht, geen ontwerpopdracht. Er wordt code gewijzigd, niet getekend.
**Opgesteld:** 7 september 2026, op basis van businessplan v6, styleguide deel 1, app-ontwerp v2 (vier maten) en de logobestanden.

---

## 0. Lees dit eerst

Je bouwt de bestaande webapp om naar het ontwerp van 7 september 2026. De app werkt al: vijf topografiesets, vijf oefenvormen, Leitner-planning, IndexedDB, geen backend. Wat verandert is de **schil**: designtokens, componenten, taal, schermindeling en responsiviteit. Wat niet verandert is `src/game-core` — dat is puur en blijft puur.

Werk **stap voor stap**. Elke stap hieronder is een eigen commit met een eigen definition of done. Ga niet door naar de volgende stap voordat `npm run check` groen is. Als een stap groter blijkt dan hier beschreven: stop, meld het, en stel een splitsing voor. Bouw niet door op een aanname.

### 0.1 Bronnen en hun rangorde

Bij tegenstrijdigheid wint de hoogste bron. Deze volgorde is bindend.

| # | Bron | Pad | Datum |
|---|---|---|---|
| 1 | Businessplan v6 | `../topo-prive/businessplan-leernu-v6.md` (buiten de repo) | 7 sep 14:07 |
| 2 | Styleguide deel 1 | `docs/leer.nu Styleguide.dc.html` | 7 sep 08:18 |
| 3 | App-ontwerp v2, vier maten | `docs/leer.nu App v2 - vier maten.dc.html` | 7 sep 11:08 |
| 4 | Logobestanden | `docs/Leer.nu Logobestanden.dc.html` + `docs/Logo/*.svg` | 7 sep 08:19 |
| 5 | Bestaande ADR's | `docs/DECISIONS.md` | doorlopend |

De `.dc.html`-bestanden zijn ontwerpcanvassen: **lees ze als HTML**, niet als screenshot. De inline `style`-attributen bevatten de exacte maten, kleuren en afstanden. Neem waarden daar letterlijk uit over; schat niets.

Het businessplan staat buiten de repo. Alle beslissingen eruit die deze opdracht raken zijn hieronder in §0.3 overgenomen — je hoeft het bestand niet te kunnen lezen.

### 0.2 Regels die tijdens de hele opdracht gelden

1. **Geen kleurliteral buiten `src/index.css`.** Bestaande lintregel. Nieuwe tokens gaan daar en nergens anders.
2. **Geen browserimport in `src/game-core`.** Bestaande lintregel.
3. **Geen zichtbare tekst buiten `src/i18n/nl.ts`.** Geen enkele string in een component.
4. **Geen enkel netwerkverzoek naar een derde partij.** Geen Google Fonts, geen CDN, geen analytics. Dit is de productbelofte, niet een voorkeur. Zie stap 2 — de geleverde logo-SVG's schenden dit vandaag.
5. **Geen nieuwe runtime-dependency** zonder dat je het expliciet voorlegt. De app draait nu op React + idb en niets anders.
6. **Kleur draagt nooit alleen betekenis.** Elke toestand heeft ook een vorm of een woord.
7. **Trefzone minimaal 44 px, op aanraakmaten 56 px** — ook op de kaart.
8. **Code, identifiers, commits en comments in het Engels. UI-tekst in het Nederlands**, via i18n-sleutels.
9. `npm install` werkt niet op elke machine (ADR-001, Codespaces). Voeg geen stap toe die een verse install veronderstelt.
10. Elke onomkeerbare keuze die je maakt komt als ADR in `docs/DECISIONS.md`, met de afweging erbij.

### 0.3 Stap 0 — beslis de tegenstrijdigheden en leg ze vast

**Doe dit vóór alle andere stappen.** Het ontwerp is ouder dan het businessplan en spreekt het op zeven punten tegen. Businessplan v6 wint. Leg elk van deze zeven vast als ADR in `docs/DECISIONS.md` en verwerk ze in de rest van het werk.

| # | Ontwerp zegt | Businessplan v6 zegt | Wat je bouwt |
|---|---|---|---|
| A | Slogan "Geleerd blijft geleerd." (P3, homepage) | Slogan **"Leren om te onthouden."**, kopregel **"Spelen. Leren. Onthouden."**, bewijsregel *"Sofie onthoudt 9 van de 12 provincies."*, conversieregel *"Nooit meer overhoren."* (§5.11, beslissing 3 en 5) | De vier vaste zinnen. "Geleerd blijft geleerd" verdwijnt. De slogan staat **nooit horizontaal naast het woordbeeld**, alleen gestapeld eronder, links uitgelijnd. |
| B | Leesmodus als schakelaar met voorbeeld (K10) en een volledige typografische variant (styleguide §C) | **De leesmodus vervalt** (beslissing 6). De voorleesknop op elke vraag blijft de toegankelijkheidsvoorziening. | Bouw de leesmodus **achter een uitgezette feature flag** (`features.readingMode = false`), niet weg. Zie §0.4 — dit is de enige beslissing waar ik tegen adviseer. |
| C | Drie tarieven: Gratis / Basis €49 / Compleet €79 (P2) | **Eén betaald tarief: €79 per jaar of €7,95 per maand, tot vier kinderen. Basis vervalt.** Daarvoor in de plaats veertien dagen gratis proberen (§8.1, beslissing 20) | Twee kolommen op de prijspagina: Gratis en leer.nu. Plus de vergelijkingstabel Squla / Junior Einstein / leer.nu die er al staat. |
| D | Gratis laag: "1 uitdaging deze week over" (K1) | **Uitdagingen versturen is gratis en onbeperkt** (beslissing 24). Gratis: tot 3 vrienden. Betaald: tot 20. | Geen weeklimiet op uitdagingen. Alleen het aantal vrienden is begrensd. |
| E | Zes modules, zes accenten. Accent 2 heet "tafels en klok" | **Zeven modules: tafels en klokkijken zijn twee modules**, elk met eigen naam, ingang, pictogram en accentkleur (§5.1, §5.5, beslissing 12) | Voeg een zevende accent toe volgens de regel in styleguide §B: zelfde ring (L 0,55 / C 0,125 licht, 0,74 / 0,115 donker), minstens 28° van elk bestaand accent en 20° van rood 25°, amber 78°, groen 150°. Vrije tinten volgens de styleguide: 216°, 262°, 300°. Leg de gekozen tint vast als ADR met de gemeten hoekafstanden erbij. |
| F | Modulerail: topo, tafels, woorden, spelling, tijdvak, vlaggen | Volgorde: **topografie, tafels, klokkijken, woordjes, spelling, tijdvakken, vlaggen** (§5.5) | Rail in die volgorde. Zes zichtbaar plus "meer"; klok schuift mee in de volgorde, niet achteraan. |
| G | `home.setMastered` = "{goed}/{totaal} vast" | **"vast", "blijft zitten" en "beheersing" vervallen.** Eén woord voor retentie: **"onthouden"**. "Beheersing" bestaat alleen als percentage in de VO-gedaante en nooit in tekst die een ouder leest. "Score" is uitsluitend de uitslag van één oefentoets of duel. (§5.7, beslissing 4) | Zie stap 4. Het businessplan noemt `home.setMastered` letterlijk als te repareren. |

### 0.4 Twee dingen waar ik tegen adviseer, en waarom

Voer ze uit zoals hierboven, maar leg ze zo aan dat terugdraaien goedkoop blijft.

**Leesmodus (B).** Beslissing 6 schrapt hem omdat de voorleesknop volstaat. Dat klopt voor een kind dat niet zelfstandig leest, maar niet voor een kind met dyslexie dat wél leest en alleen ruimere letters nodig heeft — dat is een andere doelgroep en een grotere. De styleguide heeft de variant al volledig uitgespecificeerd (letterafstand +4%, woordafstand +16%, regelafstand 1,8×, regellengte max 62 tekens, koppen in de rustige familie), dus de kosten zijn al gemaakt. **Bouw hem, zet hem uit via `features.readingMode`.** Aanzetten is dan één regel in plaats van een verbouwing. Meld dit expliciet in je oplevering.

**"Vriezer" betekent twee dingen.** In de huidige code is een vriezer een streakbescherming (`src/store/streakStore.ts`, `home.freezes`). In het ontwerp K9 betekent "in de vriezer" een item dat zo goed onthouden wordt dat het maanden niet gevraagd wordt. De styleguide heeft één icoon "vriezer". Twee betekenissen op één woord en één icoon in hetzelfde product is een fout die pas zichtbaar wordt als een kind erover valt. **Voorstel: de itemstatus houdt "in de vriezer" (dat is de ontwerpbeslissing en de sterkste metafoor), de streakbescherming wordt "rustdag".** Voer dit door in i18n en in de identifiers, en leg het vast als ADR. Wijkt Jeroen hiervan af, dan moet het andersom — maar één van de twee moet wijken.

---

## Stap 1 — Designtokens

**Bestanden:** `src/index.css`, `tailwind.config.ts`, `src/design/contrast.test.ts`

**Bron:** styleguide hoofdstuk B (kleur), C (typografie), D (ruimte en raster).

### Te doen

1. **Ontbrekende semantische tokens toevoegen** aan het lichte thema. De huidige `index.css` heeft `--good` en `--bad`; de styleguide heeft er vier plus tekstvarianten:

   ```
   --good: #287C42;          --good-text: #006E4A;
   --bad: #B02A2D;
   --attention: #BD871C;     --attention-text: #855A00;   /* --attention nooit als tekst: 3,02:1 */
   --neutral: #5C6B7A;
   ```

2. **De zes bestaande module-accenten volledig opnemen**, elk met vlak, tekst, tint en donkere variant. Vandaag staat alleen `topo` in de CSS. Neem de exacte waarden uit styleguide §B over. Structureer ze zo dat een module zijn accent als set opvraagt en niet als losse variabelen — een module is content, en een zevende module mag geen componentwijziging kosten.

3. **Het zevende accent toevoegen** (klokkijken) volgens beslissing E hierboven.

4. **Donker thema als tokens toevoegen**, niet als schakelaar. Alle waarden uit styleguide §B. Donker is **geen inversie**: de vlakken worden lichter in plaats van donkerder, de lijnwaarden zijn opgetrokken en de semantische kleuren zijn opnieuw gekozen. Zet ze onder `@media (prefers-color-scheme: dark)` en laat de app hem volgen; een expliciete schakelaar komt later. Let op: het ontwerp heeft de donkere artboards nog niet uitgetekend (alleen K3, K6, K14 en V1 staan op de planning), dus **raad geen schermindeling in donker** — alleen tokens.

5. **Typografische schaal vervangen.** De huidige `fontSize` in `tailwind.config.ts` is de oude schaal. De styleguide heeft twee schalen die op leeftijd schakelen. Bouw ze als twee sets tokens, niet als twee stylesheets:

   *PO 8–12, desktop:* score 60/60 SG700 · kop-1 40/48 SG600 −2% · kop-2 28/36 SG600 · kop-3 22/30 SS600 · tekst 20/32 SS400 · label 17/24 SS600.
   *PO, telefoon 393–412:* score 44/44 · kop-1 30/38 · kop-2 24/30 · **tekst blijft 20/32** — in PO wordt de kop kleiner, de leestekst nooit.
   *VO 12–16, desktop:* score 44/44 · kop-1 30/38 · kop-2 22/28 · kop-3 18/24 · tekst 16/24 · label 15/20 · klein 13/18.
   *VO, telefoon:* score 34/34 · kop-1 24/30 · tekst 16/24.

   De gedaante schakelt op de leeftijd in het kindprofiel — nooit op een voorkeur van de leerling. Vandaag bestaat er geen leeftijdsveld: bouw de PO-gedaante als default en de VO-gedaante als tokenset die nog niet geactiveerd wordt.

6. **Afstandsschaal vastzetten** op 4, 8, 12, 16, 24, 32, 48, 64, 96. Tussenwaarden bestaan niet. 2 px komt alleen voor als lijndikte. Beperk de Tailwind-spacingschaal hiertoe zodat een afwijkende waarde niet per ongeluk beschikbaar is. Dichtheidsregel: **PO gebruikt één stap hoger dan VO voor binnenmarges en rijafstand** (VO 16 → PO 24); alle andere afstanden zijn gelijk.

7. **Hoekstralen** 0 (tabel, kaartvlak, oefencanvas), 2 (invoerveld, keuzeveld, tabblad), 6 (knop, melding, kaart in VO), 12 (kaart in PO, dialoog, onderpaneel), vol (chip, label, voortgangsbalk, de punt). Vervang de enkele `control: 12px`.

8. **Lijndiktes** 1 (scheidingslijn), 1,5 (grens tussen kaartgebieden), 2 (icoonlijn, actieve rand, focusring), 3 (antwoordtoestand).

9. **Schaduw, drie niveaus.** Niveau 0 is de standaard en dekt ruim negentig procent: geen schaduw, scheiding met een lijn of een vlak. Niveau 1 `0 2 6` inkt 10% voor wat tijdelijk boven het scherm hangt. Niveau 2 `0 12 32` inkt 18% voor wat het scherm blokkeert, altijd met een dekvlak van inkt op 45% eronder. In donker thema wordt schaduw zwakker en neemt een lichter oppervlak de hoogte over.

10. **Trefzones.** `--touch` staat nu op 48. De styleguide kent drie waarden: 44 ondergrens, 56 PO en aanraking, 72 digibord. Maak er drie tokens van. `brand.minTouchTargetPx` staat op 48 en spreekt dit tegen — breng in lijn en noteer welke waarde wint.

11. **`contrast.test.ts` uitbreiden.** De test leest `index.css` en meet ratio's. Voeg alle nieuwe paren toe, licht én donker, met de ratio uit de styleguide als verwachting. Elk paar dat tekst draagt moet de gedocumenteerde waarde halen. Faalt er een: **repareer de token niet stilzwijgend, meld hem** — de styleguide claimt gemeten waarden en een afwijking is nieuws.

### Let op

`--good-text` (#006E4A) en het accent van de module tafels (tekstvariant #006E4A) zijn **dezelfde hexwaarde**, terwijl de styleguide zegt dat semantische kleuren buiten het accentsysteem staan en een module ze nooit mag lenen. Bouw ze als twee losse tokens met twee namen, ook al is de waarde vandaag gelijk, en meld de botsing.

### Definition of done

- `npm run check` groen, inclusief de uitgebreide contrasttest.
- Geen enkele hexwaarde buiten `index.css`.
- Een lijst van alle nieuwe tokens in de commitboodschap, met de bronparagraaf uit de styleguide erbij.

---

## Stap 2 — De punt, het woordbeeld en de pictogrammen

**Bestanden:** nieuw `src/components/Dot.tsx`, nieuw `src/components/Wordmark.tsx`, `public/`, `index.html`, `src/config/brand.ts`

**Bron:** styleguide §A, `docs/Leer.nu Logobestanden.dc.html`, `docs/Logo/*.svg`

De punt is het belangrijkste onderdeel van deze hele opdracht. Hij is tegelijk het logo, het app-pictogram, de highlight op de kaart, de voortgangsbalk en de retentie-indicator — één vorm die het hele product uitlegt. Bouw hem één keer, goed.

### Te doen

1. **`<Dot />` als enige primitief.** Eén component, één geometrie: ring met dikte 1/12 van de puntdiameter, vulling van onderaf als percentage. Props: `fill` (0–1), `size`, `tone` (inkt of papier). Vereenvoudigingsregels uit de styleguide: **op en onder 20 px valt de vulling weg** en blijft een dichte punt met 1 px lucht in de ring; **onder 16 px volledig dicht**. Dat is de enige toegestane vereenvoudiging. In negatief wordt de ringdikte 10% zwaarder.

2. **Vier standen die vorm dragen, geen kleur:** vol = onthoud je · halfvol = wel geoefend maar nog niet zeker · leeg met grijze ring = nog nooit gehad · en de halfgevulde punt is óók de vorm van de antwoordtoestand "Bijna" (stap 7). Die overeenkomst is opzettelijk en moet letterlijk dezelfde component zijn.

3. **De punt neemt nooit een modulekleur aan.** Altijd inkt op papier of papier op inkt, in elke module gelijk. Wat een module onderscheidt is het accent op de highlight, de voortgangsbalk en de module-ingang, plus het pad achter de naam (`leer.nu/topo`) — nooit het merkteken zelf.

4. **Woordbeeld als component, niet als afbeelding.** `leer` + `<Dot fill={0.62} />` + `nu`, Space Grotesk 700, letterafstand −3,5%, punt 41% van de x-hoogte op de basislijn, altijd onderkast — ook aan het begin van een zin. Vrije ruimte = de diameter van de punt, aan alle vier de zijden. Minimale afmeting 72 px breed. In het woordbeeld is de vulling **nooit geanimeerd**.

5. **Ship-blocker in de geleverde SVG's.** De vier woordbeeld-SVG's in `docs/Logo/` laden Space Grotesk via een `@import` uit Google Fonts. Dat is precies het verzoek naar een derde partij dat dit product niet doet, en het staat in de README als de reden dat de repository publiek is. **Gebruik die bestanden niet ongewijzigd in de app.** Twee wegen: (a) het woordbeeld als React-component met de zelf gehoste Space Grotesk — voorkeur, want dan is het levende tekst zonder verzoek; (b) de letters omzetten naar contouren, wat handwerk in een tekenprogramma is en dus buiten deze opdracht valt. Kies (a), en meld dat de SVG-set voor extern gebruik nog omgezet moet worden.

6. **`docs/Logo/leer-nu-merkteken-topo.svg`, `-vlaggen.svg` en `-woorden.svg` bestaan, maar de logodocumentatie zegt letterlijk "geen modulevarianten".** Gebruik ze niet. Meld de tegenstrijdigheid; verwijderen is aan Jeroen.

7. **Favicon en app-pictogrammen.** `public/favicon.svg` vervangen door de merktekenvorm; 16 px is de dichte variant. iOS 1024 met masker 22,4%; Android achtergrond inkt met voorgrond punt in veilige zone 66/108. Pictogram én woordbeeld gebruiken **nooit** een module-accent.

8. **`src/config/brand.ts` bijwerken.** `name` staat op `'Leernu'`; het merk is `leer.nu`, altijd onderkast. `tagline` staat op `'Leer waar alles ligt'` en wordt `'Leren om te onthouden.'`. Voeg de kopregel, bewijsregel en conversieregel toe als vaste zinnen — de merktaal is data, niet iets dat een component zelf mag formuleren. Het commentaar in `brand.ts` zegt dat white-labelling een eenbestandswijziging moet blijven: houd dat waar.

### Definition of done

- Eén `Dot`-component, gebruikt door logo, voortgangsbalk, retentie-indicator, itemstatus en de antwoordtoestand "Bijna".
- Nul netwerkverzoeken bij het laden van de app. Controleer dit in de e2e-test, niet met het oog.
- De vier vaste zinnen staan in `brand.ts`, niet in een component.

---

## Stap 3 — Componentlaag

**Bestanden:** `src/index.css` (`@layer components`), nieuw `src/components/`

De `tk-*`-klassen in `index.css` zijn een goede basis maar dekken de nieuwe componenten niet. Breid uit tot de set die het ontwerp gebruikt, met **alle toestanden**: rust, hover, focus, actief, uitgeschakeld, bezig.

**Te bouwen of bij te werken:** knop primair / secundair / tertiair (in PO hoogte 56, in VO 44) · chip · pill · invoerveld met focusring van 2 inkt met 2 papier ertussen · kaart (PO hoekstraal 12 marge 24, VO hoekstraal 6 marge 16) · tabel met `tabular-nums` en rechts uitgelijnde getallen · statuslabel (label, géén chip: geen rand, geen trefzone-eis) · voortgangsbalk (vol afgerond, de punt als eindpunt) · modulekaart · onderpaneel · dialoog met dekvlak inkt 45% · kopbalk 64 · modulerail 88 · tabbalk mobiel.

**Focusstijl is in beide thema's neutraal**, nooit semantisch of module-gekleurd: inkt-ring op licht, papier-ring op donker. Dat staat er al goed in; houd het zo.

**Wat een accent mag kleuren:** de highlight op de afbeelding, de voortgangsbalk en de module-ingang. Niets anders — geen knop, geen melding, geen tabel. Bouw dat als een regel die je kunt controleren, niet als een afspraak.

### Definition of done

- Elke component heeft elke toestand, en die toestanden zijn zichtbaar in een test of een overzichtsscherm dat niet in productie meegaat.
- Geen component gebruikt een accent buiten de drie toegestane plekken.

---

## Stap 4 — Taal

**Bestanden:** `src/i18n/nl.ts`

Dit is de goedkoopste stap met de grootste merkwaarde, en het businessplan noemt hem als voorwaarde vóór de eerste betalende gebruiker.

### Te doen

1. **"vast" verdwijnt volledig.** `home.setMastered` wordt `'{goed} van de {totaal} onthoud je'`. Zoek de hele repository af op "vast", "blijft zitten" en "beheersing" — ook in comments, ADR's en testnamen — en vervang. "Beheersing" mag alleen terug als percentage in de VO-gedaante, en nooit in tekst die een ouder leest.
2. **Vaste formuleringen overnemen:** *"dit onthoud je nu"*, *"nog niet onthouden"*, *"Sofie onthoudt 9 van de 12 provincies"*.
3. **"Score" krijgt één taak:** de uitslag van één oefentoets of duel. Nergens anders. `result.score` mag blijven; `home.*` mag het woord niet gebruiken.
4. **Verboden woorden:** "leuk", "spelenderwijs", "avontuur", "plezier" komen nergens voor. Het woord "spelen" mag, maar alleen als eerste stap met het eindpunt erachter.
5. **Registers.** Kind 8–12: over de opgave, nooit over het kind — geen "wat ben jij slim", geen dubbele uitroeptekens, geen emoji in plaats van woorden. Ouder: je, feitelijk, twee zinnen, geen zorg aanpraten en geen jubel. Loop de huidige teksten hierlangs; `result.title` = "Klaar!" wordt "Ronde klaar" conform K8.
6. **Beloningstaal.** "badge" wordt **reisstempel**. Een stempel krijg je pas als een item vier keer op rij goed gaat — nooit voor meedoen alleen. Levels en XP verdwijnen uit beeld ten gunste van **groeipunten**, uitsluitend van deze week, uitsluitend relatief ten opzichte van vrienden. **Nooit een absolute score en nooit een klas.** Dit raakt `src/store/rewardStore.ts` en `game-core/rewards.ts`: houd de opslag intact, verander wat er getoond wordt, en leg de gedragswijziging vast als ADR.
7. **Redactieregels.** Fryslân met â in de topografiemodule, nooit Friesland. De ĳ-ligatuur wordt nooit gebruikt. Aanhalingstekens zijn ’ en „ ”, nooit ' of ". Duizendtal met een punt, decimaal met een komma, percentage zonder spatie: 1.104 punten, 8,5 gemiddeld, 74%.
8. **Cijfers met vaste breedte zijn verplicht** in elke tabel en elke score, en een teller loopt altijd rechts uitgelijnd zodat het getal niet danst bij elk antwoord.

### Definition of done

- Een grep op "vast", "beheersing", "blijft zitten", "leuk", "spelenderwijs", "avontuur", "plezier" levert nul treffers in gebruikersgerichte tekst.
- Een test die faalt bij een string in een component in plaats van in `nl.ts`.

---

## Stap 5 — Responsieve schil, vier maten

**Bestanden:** `src/App.tsx`, nieuw `src/features/shell/`

**Bron:** app-ontwerp v2, de vier kolommen per scherm, plus styleguide §D.

De app is vandaag één gecentreerde kolom van `max-w-2xl`. Het ontwerp kent vier maten met elk een eigen navigatiemodel. **De navigatiestructuur volgt het aantal handen en de afstand tot het scherm, niet het besturingssysteem.**

| Maat | Raster / goot | Marge | Navigatie |
|---|---|---|---|
| Desktop 1440 (en 1366) | 12 / 24 | 48 (Chromebook 32) | Vaste kopbalk 64, modulerail 88 links. Alles binnen 768 hoog: **geen verticaal scrollen tijdens een ronde.** Bij 1366 valt de rechterkolom weg, de rail blijft. |
| Tablet liggend 1024×768 | 8 / 20 | 24 | Rail wordt een balk onderaan van 72 hoog met trefzones 88×56. Trefzones naar 56. |
| Tablet staand 768×1024 | 6 / 20 | 24 | Vraagbalk **bóven** het canvas, antwoordknoppen onderaan binnen duimbereik. |
| Mobiel 393×852 | 4 / 16 | 20 | Rail vervalt, tabbalk onderaan met vier items (Vandaag, Onthouden, Vrienden, Jij), trefzone 56 inclusief label. Modules bereikbaar via de kaarten in de stroom. |
| Android 412×915 (delta) | 4 / 16 | 16 | Rand-tot-rand met doorlopende achtergrond onder de systeembalken, navigatiebalk 48, systeem-terugknop vervangt de veeg, **geen eigen terugknop linksboven.** |

**De harde regel tijdens een ronde:** op alle vier de maten verdwijnt álle navigatie. Geen rail, geen onderbalk, geen tabbalk — alleen het stopkruis, de tien voortgangspunten en de voorleesknop. Vraag en antwoordgebied staan altijd samen in beeld, ook op 393×852.

Digibord 1920 staat in de styleguide maar valt **buiten scope** tot het schoolkanaal opengaat. Laat de maat in het tokensysteem staan zodat hij later niets kost; bouw er geen scherm voor.

### Definition of done

- Playwright-tests op alle vier de breedtes plus de Android-delta.
- Een test die aantoont dat er tijdens een ronde geen navigatie-element in de DOM zit.
- Een test die aantoont dat er op 1366×768 tijdens een ronde niet verticaal gescrold kan worden.

---

## Stap 6 — De schermen

Werk ze in deze volgorde af. Elk scherm is een eigen commit. Per scherm: lees de vier kolommen in `docs/leer.nu App v2 - vier maten.dc.html`, lees het "Waarom zo"-blok eronder — daar staat de redenering die je nodig hebt om de randgevallen goed te krijgen — en bouw.

| Ontwerp | Bestaand bestand | Kern van de wijziging |
|---|---|---|
| **K1 Vandaag** | `src/features/home/HomeScreen.tsx` | Toetsdatumblok neemt de plek van de opdracht in: het enige blok met een oppervlak-vlak en een rand, want het is de reden dat het kind vandaag oefent. Eén primaire knop. "Datum wijzigen" is secundair, hoogte 44 op desktop en 56 op aanraking. Profielwissel rechtsboven met chevron. Retentiepunt en modulekaarten worden op mobiel rijen met het getal rechts uitgelijnd. |
| **K2 Kies je ronde** | nieuw scherm | Twee genummerde stappen: **1 · Waarover**, **2 · Hoe wil je oefenen?** De vier modi in oplopende zwaarte met een regel die zegt waarvóór ze zijn: aanwijzen (voor de eerste keer) → meerkeuze (de instap naar typen) → typ de naam (voor de toets) → ontdekken (rondkijken, geen vragen). Bliksemronde en overleven blijven chips: dat zijn geen manieren om te leren. **De gekozen combinatie staat letterlijk op de startknop.** De kaart is hier oriëntatiebeeld en krimpt het eerst: 420 → 300 → band van 280 hoog → 180. |
| **K3 Vraag, aanwijzen** | `src/features/practice/PracticeScreen.tsx` | Inhoudelijk ongewijzigd; alle vier de maten zijn nieuw. Desktop en tablet liggend: vraag náást de kaart. Tablet staand: vraagbalk bóven het canvas als blok met oppervlak-vlak en grens 1,5. Mobiel: de kaart vult het beeld en de vraag staat erop, op papier met een rand van 1,5 zodat het contrast niet van de kaart afhangt. Voorleesknop krijgt op aanraking trefzone 56. De tien punten blijven bovenaan; op mobiel 14 px met 5 ertussen, want ze zijn een aanduiding en geen trefzone. |
| **K4 Goed** | idem | De retentiepunt springt zichtbaar (in het ontwerp 35% → 75%) en de tekst zegt wat dat betekent. Beloning zonder confetti. Feedback staat op elke maat op dezelfde plek als de vraag stond, zodat er tussen K3 en K4 niets verschuift behalve de inhoud. Op mobiel is het feedbackblok **geen dialoog** maar een strook in de stroom: een ronde wordt nooit door een modaal venster onderbroken. |
| **K5 Meerkeuze** | nieuw, zie stap 7 | Nu licht de kaart wél een gebied op — het gebied ís de vraag — en verdwijnt elk label. Geen accentkleur op de knoppen. Twee bij twee op 88 hoog waar breedte is; vier rijen op tablet liggend; twee kolommen op tablet staand; vier onder elkaar op 56 op mobiel, omdat provincienamen te lang zijn voor twee bij twee op 393. De antwoorden staan nooit óver de kaart. |
| **K6 Fout, en "Bijna"** | `PracticeScreen.tsx` | **De kop is het goede antwoord, niet "Fout".** Eerst wat het wél is, dan pas wat het kind koos. Geen aftrek, geen leven verloren, geen geluid — "deze vraag komt straks terug" is de hele consequentie. Zie stap 7 voor de vier vormen. |
| **K7 Typ de naam** | `PracticeScreen.tsx` | Nieuw scherm in de flow. **Het antwoordveld staat altijd 16 boven het toetsenbord** en "Nakijken" schuift mee: op geen enkele maat verdwijnt de vraag achter het toetsenbord. Veld met hoekstraal 2. Accentpaneel voor Frans en Duits: één rij accenttoetsen van 56 boven het toetsenbord, in de layout van de taal, **geen popup** — een kind dat élève moet typen mag niet eerst een toets ingedrukt houden. Voor topografie is dit alleen relevant voor Fryslân. |
| **K8 Ronde klaar** | `src/features/practice/ResultScreen.tsx` | De score staat er maar is niet het resultaat: **"Wat er is veranderd"** is het product — twee vragen meer die je nu onthoudt. Eén primaire knop, "Nog een ronde", opnieuw de kortste weg naar oefenen. "+2 groeipunten deze week · 2e van je vrienden" in plaats van een klaspositie. Reisstempel met het criterium erbij. |
| **K9 Wat je onthoudt** | nieuw scherm | Tabel met kolommen provincie / onthoud je / goed / weer op, met `tabular-nums`. Statuslabels zijn labels en geen chips. "In de vriezer" krijgt het driestreep-icoon en het neutrale label — **niet groen**, want "goed" is een antwoordtoestand en mag nooit een status betekenen. Daarnaast "alles in één blik": de punten uit stap 2 als heatmap, één vorm en meer standen, geen nieuw diagram. |
| **K10 Jij** | `src/features/player/ProfileGate.tsx` + nieuw profielscherm | Avatar uit een vaste set met wisselknop, groep, profielwissel naar andere kinderen van het gezin. School en woonplaats bestaan niet. Vriendcode in de mono-familie met ruime letterafstand, want hij wordt voorgelezen en overgetypt, niet gelezen als woord. Voorlezen staat standaard aan; timer staat uit met de reden erbij ("Haast helpt het onthouden niet"). Leesmodus: zie beslissing B — bouwen, uitgezet. |

**Publieke pagina's P1–P3 en het ouderoverzicht V1 vallen buiten deze opdracht.** Ze vragen een backend, accounts en betalingen, en ADR-015 zegt dat er geen backend is. Bouw ze niet half. Wat je wél doet: de designtokens en componenten uit stap 1–3 zo neerzetten dat die pagina's er later op passen.

### Wat je met de getallen in het ontwerp doet

Het ontwerp toont "12 van de 20", "20 provincies over 5 rondes", "60%", "+2 groeipunten". Dat zijn **voorbeeldwaarden, geen specificatie.** De app heeft twaalf provincies, niet twintig. Neem nooit een getal uit het ontwerp over als constante; leid alles af uit de content en de store. Waar het ontwerp een getal toont dat de app nog niet kan berekenen, bouw je het element niet.

---

## Stap 7 — De vier antwoordvormen

**Bestanden:** `src/index.css`, `src/features/practice/MapCanvas.tsx`, `src/game-core/answer.ts`

Dit is het inhoudelijke hart van het ontwerp en het is vandaag maar half af. **Vier vormen, nul nieuwe kleurwaarden.** Elk moet ook zonder kleur te onderscheiden zijn — in beide thema's en beide gedaantes.

| Toestand | Vorm | Vandaag in de code |
|---|---|---|
| **Goed** | Dicht vlak, vinkje, rand 2 inkt | `.tk-shape-target` doet iets anders: open vlak met groene rand. Hermappen. |
| **Bijna** | Open vlak, **enkele** rand van 3, **halfgevulde punt** in inkt. Geen vinkje, geen kruis, geen nieuwe kleur — amber zou een vijfde betekenis introduceren en arcering staat altijd op fout. | Bestaat alleen als tekst (`practice.almost`, ADR-017). Vorm ontbreekt. |
| **Fout** | Gearceerd vlak, kruis. **De arcering staat altijd op fout, nooit op goed:** het uitzonderingssignaal krijgt de textuur. | `.tk-shape-wrong` klopt al. |
| **Gemist juist antwoord** | Open vlak, **dubbele** rand, **volle** punt in het midden. Nooit hetzelfde beeld als een antwoord dat de leerling zelf goed had. | Ontbreekt. |

De halfgevulde punt bij "Bijna" is **exact dezelfde vorm** die in K9 "wel geoefend, nog niet zeker" betekent. Gebruik letterlijk dezelfde `Dot`-component; die betekenisoverlap is de reden dat de vorm gekozen is.

**Beweging.** Bij een fout antwoord animeert het systeem van de aangewezen plek naar de juiste plek, zodat het kind de ruimtelijke afstand ziet in plaats van alleen een kruis. Dit is het enige moment waarop animatie didactisch werk doet. De keyframe `tk-travel` bestaat al; sluit hem aan op de nieuwe vormen. `prefers-reduced-motion` haalt de beweging weg, **nooit de terugkoppeling** — een antwoord blijft groen worden en blijft "goed" zeggen.

### Meerkeuze (K5) — scopevraag

Meerkeuze is nieuwe spellogica, geen UI: het vraagt afleiders, een keuze wat een goede afleider is, en een uitbreiding van `PracticeMode`. Het ontwerp zet het neer als **de instap naar typen**, niet als alternatief ervoor, en K2 maakt die volgorde zichtbaar. Twee opties:

- **Binnen scope:** breid `PracticeMode` uit met `meerkeuze`, kies afleiders uit dezelfde set met een regel die uitlegbaar is (buurgebieden eerst, want dat is de fout die een kind werkelijk maakt), en leg de afleiderregel vast als ADR. Vier antwoorden, **altijd in dezelfde volgorde als de vorige keer dat het kind deze vraag kreeg** — dat staat er niet toevallig; een wisselende volgorde maakt herkenning tot een geheugenspel over posities.
- **Buiten scope:** bouw K2 zo dat de vierde modus zichtbaar maar uitgeschakeld is, en lever de rest.

**Vraag dit expliciet aan Jeroen voordat je begint.** Kies bij geen antwoord de tweede optie: een half werkende oefenvorm is erger dan een aangekondigde.

---

## Stap 8 — Verificatie

Niet optioneel, en niet aan het eind pas bedacht.

1. `npm run check` — lint, typecheck, format, contentvalidatie, unittests, build.
2. `npm run test:e2e` — flows, toetsenbordbediening, axe op elk scherm en op alle vier de maten.
3. `npm run lighthouse` — performance ≥ 85, toegankelijkheid ≥ 95.
4. **Contrasttest uitgebreid** naar alle nieuwe paren, licht en donker, met de styleguidewaarden als verwachting.
5. **Netwerktest:** een e2e-test die aantoont dat de app geen enkel verzoek doet buiten de eigen origin. Dit is de claim in de README en hoort afgedwongen te zijn, niet beloofd.
6. **Kleurblindheidscontrole:** elke toestand moet in grijswaarden te onderscheiden zijn. Doe dit als test op de vormen, niet als oogtoets.
7. **Schermafdrukken op 1440, 1024, 768 en 393**, naast de bijbehorende kolom uit het ontwerpbestand. Meld elk verschil dat je bewust hebt gemaakt.
8. **`docs/DECISIONS.md` bijgewerkt** met elke ADR uit stap 0 en elke keuze die je onderweg hebt moeten maken.

---

## Wat buiten scope valt

Bouw dit niet, ook niet gedeeltelijk, ook niet als het makkelijk lijkt: accounts, gezinsprofielen met server, betalingen en betaalmuur, de vriendenlaag en uitdagingen, het ouderoverzicht V1, de weekmail, de publieke pagina's P1–P3, het digibord, en de VO-gedaante als werkend scherm (alleen de tokens). Deze staan in het businessplan gepland voor 27/28 en later en vragen alle een backend, wat ADR-015 vandaag uitsluit.

---

## Werkwijze

- Eén stap, één commit, één groene `npm run check`.
- Begin elke stap met de bron erbij: open het `.dc.html`-bestand en lees de inline stijlen van het onderdeel dat je bouwt.
- Kom je een tegenstrijdigheid tegen die niet in §0.3 staat: **stop en meld.** Businessplan boven styleguide boven ontwerp, maar een nieuwe botsing is informatie die Jeroen moet zien.
- Raad geen ontwerp dat niet is uitgetekend. Het donkere thema, de VO-gedaante en de vriendenschermen K11–K16 bestaan nog niet op papier. Tokens ja, schermen nee.
- Lever aan het eind een lijst op van: wat gebouwd is, welke ADR's zijn toegevoegd, welke tegenstrijdigheden je bent tegengekomen, en wat je bewust anders hebt gedaan dan het ontwerp.
