# Helden, sterren en kisten — stress-test en concept

Datum: 11 september 2026 · Reviewer: Claude · Voor: Jeroen Weijs
Basis: `README.md`, `docs/DECISIONS.md` (ADR-040, 059, 065, 067, 070, 071, 076, 080, 081, 084, 096),
`src/game-core/{helden,collection,rewards,streak}.ts`, `src/features/reis/*`,
`src/features/home/SideColumn.tsx`, `src/components/{Stickers,stickerSet}.ts(x)`,
`src/store/heldenStore.ts`, `src/i18n/nl.ts`, `docs/DATAMODEL.md`.

---

## 0. Wat er nu feitelijk staat (10 regels)

1. Tien goede antwoorden zijn een ster, vijf sterren een kist, een kist is dus **50 goede antwoorden** (`helden.ts`).
2. Welke van de **twaalf** helden eruit komt is een uniforme trekking uit `crypto.getRandomValues` in `heldenStore.ts`; `game-core` blijft puur en krijgt een getal in [0,1).
3. **Drie dubbelen** zetten een held één reeks omhoog: brons → zilver → goud → platina → ultra. Vier stappen, dus **twaalf dubbelen** = 13 exemplaren van dezelfde held.
4. Vier uitkomsten: `nieuw`, `dubbel`, `hoger`, `vol`. `vol` = held staat al op ultra en de trekking doet niets.
5. De twaalf "helden" zijn letterlijk de twaalf dierentekeningen uit `Stickers.tsx` (kat…draak). **Er bestaat nog geen held**: geen naam, geen tekening, geen kracht.
6. `uitLadder()` migreert: elk dier wordt de held op dezelfde `plek`, in de hoogste reeks die het kind had; reeds betaalde kisten gelden als geopend. Opslag: JSON in `settings` onder `helden:<kindId>`, dus per kind gescheiden.
7. De oude ladder (ADR-067/071/080) gaf één dier per niveau; `collection.ts` **deelt sinds ADR-096 niets meer uit** en blijft alleen bestaan als bron voor de migratie.
8. De rechterkolom (`SideColumn.tsx`, op élk scherm) toont: toetsen, voortgang (heldplaat, "Niveau N", reeksnaam, balk, "x van de 12", "nog X goede antwoorden tot niveau N+1"), goed-percentage + antwoordreeks, favorieten. **Sterren en kisten staan er niet op** — bewust, volgens ADR-096.
9. De kist opent alleen op het resultaatscherm (`Beloning.tsx`) en op `/ontdekkingsreis`; de spelregels staan daar voluit, inclusief "alle twaalf zijn even kansrijk" (`reis.regel1`–`regel4`).
10. `README.md` r.132–143 beschrijft nog de oude wereld: "sixty animals", pakjes, "a handful of times a month", en **"Nothing on that page can be bought, won by chance or reached by waiting"** — die zin is sinds 10 september onjuist. ADR-080 en ADR-081 herhalen hem.

**Eén bevinding die nergens in de ADR's staat en die alles kleurt:** sinds ADR-096 deelt een niveau niets meer uit. De rechterkolom — het enige voortgangsobject dat op elk scherm staat — telt af naar **een gebeurtenis zonder inhoud** ("nog 6 goede antwoorden tot niveau 7"), terwijl de gebeurtenis die wél iets uitdeelt (de kist, elke 50) daar niet te zien is. Dat is geen detail; het is het probleem waar dit hele traject mee begon, nu ingebouwd in de nieuwe versie.

---

# DEEL A — STRESS-TEST

## A1. Diagnose: thema, loop of zichtbaarheid?

### De drie hypothesen, scherp gescheiden

**H1 — Thema.** De dieren zijn niet cool. Dan verandert een skin het gedrag.
*Voorspelling:* met dezelfde loop maar superheldnamen en -tekeningen stijgt de speeltijd.

**H2 — Loop.** De beloning stond te ver weg. Feit uit `rewards.ts`: de niveaucurve is 25, 50, 100, 200, dan 200. Het 4e dier kostte 25 goede antwoorden, het 5e 50, het 6e 100, het 7e 200, en elk dier daarna 200. Het twaalfde dier zat op **1.375 goede antwoorden**.
*Voorspelling:* met dezelfde dieren maar een vaste kadans van 50 stijgt de speeltijd.

**H3 — Zichtbaarheid.** Het pakket verbergt wat er komt (ADR-081), de kolom noemt de volgende beloning niet meer, en er is tussen twee beloningen niets dat beweegt. Er is dus niets om naar te verlangen en niets dat vooruitgang toont.
*Voorspelling:* met dezelfde dieren en dezelfde curve, maar een zichtbare ster elke tien antwoorden en een zichtbaar aftelmoment, stijgt de sessielengte.

### Hoe je ze binnen een week uit elkaar trekt

Je hebt twee kinderen; dat is te weinig voor statistiek, maar genoeg voor een A/B over de tijd als je maar één ding tegelijk verandert.

| Dag | Wat je doet | Wat het uitsluit |
|---|---|---|
| 1 (ma) | **Nulmeting, zonder iets te bouwen.** Lees `attempts` van de afgelopen 8 weken uit: goede antwoorden per week, dagen met minstens één ronde. Die data staat er al sinds v1. | niets — dit is je referentie |
| 2 (di) | **H3-test.** Zet de sterrenrij in de rechterkolom en laat bij elk tiende goede antwoord in de ronde een ster vollopen. Verander verder níéts: dieren blijven, curve blijft. | als de sessielengte stijgt: H1 is niet nodig |
| 3–5 | Laat het staan. Meet dezelfde twee getallen. | |
| 6 (za) | **H2-test.** Zet de kadans op 50 met een gegarandeerd nieuw dier. Nog steeds dieren, nog steeds geen heldentekening. | als dit het verschil maakt en dag 2 niet: het was de loop |
| 7 (zo) | **H1-test, gratis.** Vraag ze het gewoon: leg de twaalf bestaande tekeningen neer en zeg "stel dat dit superhelden zijn met namen en krachten — wil je ze dan?" en kijk of ze doorvragen over de namen of over hoe snel je ze krijgt. | de richting van hun eigen antwoord |

De hele week kost je **geen enkele tekening**. Dat is het punt: H1 is de enige hypothese die dure assets vereist, en het is de hypothese waarvoor je het minste bewijs hebt.

### Mijn oordeel

**H3 eerst, H2 direct daarachter, H1 een verre derde.** Onderbouwing, en ik scheid feit van interpretatie:

- *Feit:* de curve decelereert hard. Vanaf het 7e dier kost elk dier 200 goede antwoorden. Bij vier sessies van 50 per week is dat één dier per week, met zes dagen niets ertussen.
- *Feit:* ADR-081 haalde de naam van het volgende dier weg ("Hierna: vos in zwart" was een week van tevoren een verrassing verklappen). Daarmee verdween ook het enige object van verlangen. Het kind weet nu alleen nog *wanneer*, niet *wat*.
- *Feit:* sinds ADR-096 telt de kolom af naar een niveau dat niets uitdeelt.
- *Interpretatie:* een kind van 8 en 10 zegt zelden "de bekrachtigingskadans klopt niet". Ze zeggen "saai", of ze noemen iets dat ze wél leuk vinden. Hun uitspraak is een **betrouwbaar signaal over smaak en een onbetrouwbaar signaal over oorzaak**. Dat is geen reden om ze niet te geloven — het is een reden om de oorzaak apart te toetsen.
- *Hypothese:* de klacht kwam op het moment dat de loop op zijn slechtst was (dier 7 en verder, 200 antwoorden per stuk). Dat is een samenloop die je in één week kunt ontwarren en waar ADR-096 nu ongetoetst overheen bouwt.

### En dan het scherpste punt over ADR-096

**Het goede deel van ADR-096 is de kadans van 50, niet de trekking.** ADR-096 doet stilzwijgend twee dingen tegelijk: het vervangt de decelererende niveaucurve door een vaste kist elke 50 goede antwoorden (dat is de loop-fix, en die is goed), en het voert een kansmechanisme in (dat is een aparte beslissing die is meegelift). Als de nieuwe versie straks beter werkt, weet je niet welk van die twee dat deed — en de kans is groot dat je de trekking crediteert voor winst die de kadans opleverde.

**Over "superhelden" specifiek, expliciet zoals gevraagd:** zoals ADR-096 nu is gebouwd, verandert "superhelden" alleen de skin. Het zijn dezelfde twaalf `plek`-indexen, dezelfde tekeningen, dezelfde reeksen. De loopverandering die eronder zit (50 in plaats van een oplopend niveau) is echt, maar die had niets met superhelden te maken en had ook met dieren gekund. Er is één uitzondering waar het thema wél inhoudelijk gewicht krijgt: een held kan een **kracht** hebben en een dier niet, en een kracht is iets waar een kind een voorkeur over vormt. Dat is het enige echte argument voor helden, en het staat of valt met deel B1.

---

## A2. Het kansmechanisme

### A2(a) Interne consistentie

Wat er nu feitelijk onjuist is, in volgorde van ernst:

| Plek | Huidige tekst | Status |
|---|---|---|
| `README.md` r.142–143 | "Nothing on that page can be bought, won by chance or reached by waiting" | **onjuist** |
| ADR-081 | "nothing in this product is ever earned by chance or by waiting" | **onjuist** (staat als geaccepteerd, niet geamendeerd) |
| ADR-080 | "nothing behind money, chance or waiting" | **onjuist** (idem) |
| ADR-076 | "Everything on the page is bought with correct answers and nothing else" | **onjuist** |
| `README.md` r.132–142 | "sixty animals", pakjes, "a handful of times a month" | **verouderd** |
| `README.md` r.127–130 | "'Jouw voortgang' is the level a child has reached … nog 6 goede antwoorden" | **misleidend**: dat niveau deelt niets meer uit |
| `README.md` geheel | noemt sterren, kisten en helden nergens | **omissie**: de hoofdloop van het product staat niet in de eigen README |

ADR-096 zegt "revises ADR-067's first condition and spec §4.5 in one place". Dat is netjes voor ADR-067, maar **ADR-080, 081 en 076 zijn niet genoemd** en staan ongewijzigd als geaccepteerd in hetzelfde document. Op een publieke repo is dat het duurste soort fout: niet een verkeerde claim, maar een document dat zichzelf tegenspreekt terwijl verifieerbaarheid de hele belofte is.

**Als je ADR-096 houdt**, is dit de formulering die de nieuwe werkelijkheid dekt zonder de belofte te verwateren — en ze hoort in de dérde alinea van de README (de "why this repository is public"-alinea), niet in een bijzin achteraan:

> Nothing here can be bought, and nothing arrives by waiting. One thing is decided by chance and only one: **which** of the twelve heroes a chest holds. Whether there is a chest, and what it costs, is arithmetic on correct answers — fifty of them, and nothing else moves it. Every hero is equally likely, the app says so to the child in those words, and the draw is in `heldenStore.ts` where you can read it.

Let op wat die formulering kost: je verplaatst een kansmechanisme voor kinderen van een voetnoot naar de etalage. Dat is de eerlijke variant. Als die zin je ongemakkelijk maakt, is dat informatie over de beslissing, niet over de zin.

**Als je A3 volgt**, hoef je geen van deze vier documenten te amenderen — ze worden weer waar. Dat is geen bijkomstigheid maar een argument: een ontwerp dat drie geaccepteerde ADR's en de README weer kloppend maakt is goedkoper dan een ontwerp dat ze alle vier moet herschrijven.

### A2(b) Juridisch en ethisch

**Nederlands kansspelrecht: geen risico, en dat is hard.** De Afdeling bestuursrechtspraak van de Raad van State oordeelde op **9 maart 2022** dat de loot boxes in FIFA 22 géén kansspel zijn in de zin van de Wok: het openen van packs is geen zelfstandig spel maar onderdeel van een behendigheidsspel. De dwangsom van de Kansspelautoriteit werd vernietigd. Als zélfs betaalde FIFA-packs geen kansspel zijn, is een gratis kist in een oefenapp dat met grote zekerheid ook niet. *Feit.*

**PEGI: valt er buiten, maar de lijn beweegt.** PEGI's nieuwe "interactive risk categories" gaan per **juni 2026** in en geven games met "paid random items" **minimaal PEGI 16**. De categorie is expliciet beperkt tot bétaalde willekeurige items; gratis in het spel verdiende willekeurige beloningen vallen er niet onder. leer.nu wordt dus niet geraakt. *Feit.* Wat het wél zegt: een classificatie-instituut markeert dit mechanisme nu überhaupt, en de reden is het mechanisme, niet alleen het geld.

**DSA artikel 28: het echte, en niet waar je het verwacht.** De Commissie publiceerde op **14 juli 2025** richtsnoeren bij artikel 28(1). Over loot boxes zeggen die: zorg dat kinderen niet worden blootgesteld aan commerciële praktijken die manipulatief zijn of tot ongewenste uitgaven leiden, "including certain virtual currencies or loot-boxes". Dat is **commercieel geframed** — leer.nu heeft geen commercie, dus die passage raakt je niet. Maar dezelfde richtsnoeren zeggen ook: zet standaard uit wat overmatig gebruik in de hand werkt, "like communication 'streaks'", en verwijder "persuasive design features aimed predominantly at engagement". *Feit.* **Je dagstreak is daarmee een grotere blootstelling aan deze richtsnoeren dan je kist.** Dat je in `streak.ts` en ADR-072 bewust hebt ontworpen om niet te straffen is precies het verweer dat je wilt hebben — en je hebt het al. Naleving is bovendien vrijwillig; het weegt mee in de compliance-beoordeling van de Commissie.

**Digital Fairness Act: open einde.** Status per 2026: aangekondigd, voorstel geagendeerd voor **Q4 2026**, gericht op dark patterns, verslavend ontwerp en bescherming van minderjarigen. Loot boxes worden in het huidige dossier niet met zoveel woorden genoemd. *Feit, met de aantekening dat dit een bewegend doel is en dat het maar één kant op beweegt.*

**Waar het reputatierisico zit — en dat is niet juridisch.**

De publieke argumentatie van deze repo staat in één alinea: het bekendste gratis alternatief wordt betaald door advertenties van meer dan honderd vendors op een pagina waar elfjarigen op zitten, en "no trackers" is hier geen claim maar iets dat je kunt controleren. Dat is een **moreel** argument, en morele argumenten zijn asymmetrisch: ze kosten jaren om op te bouwen en één zin om te verliezen. Het woord "loot box" in een kinderleerapp is die zin. En je verdediging — "het is gratis, dus het is geen loot box" — is letterlijk de verdediging die de industrie voert. Je zou dan het vocabulaire lenen van precies de sector waar dit product tegen is opgezet.

**En los van reputatie, het gedragspsychologische bezwaar.** Het schadelijke aan loot boxes is het **variabele bekrachtigingsschema**, niet de betaling. Een gratis kist traint hetzelfde schema: onvoorspelbare beloning per handeling, met dubbelen als near-miss. Dit product bestaat om een dagelijkse studiegewoonte te installeren bij een kind van acht. Het schema dat je installeert is onderdeel van wat je leert. "Blijf trekken, uiteindelijk komt er iets" is niet de gewoonte die je bedoelde te bouwen. Dat is een bezwaar dat overeind blijft ook als niemand het ooit ziet.

### A2(c) De wiskunde

**Aannames, expliciet.** Kist = 50 goede antwoorden (feit, `GOED_PER_KIST`). Twaalf helden, uniforme onafhankelijke trekking (feit, `openKist` + `trek`). Jouw aanname: 50 goede antwoorden per sessie, dus **één kist per sessie**. Mijn aanname: **vier sessies per week = 200 goede antwoorden**. Die laatste is de enige vrije knop; alle weken schalen er lineair mee.

**De twaalf compleet** (coupon collector, n = 12; exact berekend, niet gesimuleerd):

| | kisten | goede antwoorden | weken (200/wk) |
|---|---|---|---|
| verwachting | 37,2 | 1.862 | 9,3 |
| mediaan | 35 | 1.750 | 8,8 |
| p90 | 55 | 2.750 | 13,8 |
| p95 | 63 | 3.150 | 15,8 |
| p99 | 82 | 4.100 | 20,5 |

Standaarddeviatie 13,7 kisten (686 antwoorden), scheef naar rechts. Twee kinderen die precies even hard werken kunnen **vier maanden** uit elkaar liggen. Met een broer en zus op één apparaat is dat geen statistisch detail.

**Waar de curve breekt — marginale kosten per held:**

| stap | kisten | goede antwoorden |
|---|---|---|
| 1 → 6 (samen) | 7,8 | 392 |
| 9 → 10 | 4,0 | 200 |
| 10 → 11 | 6,0 | 300 |
| 11 → 12 | **12,0** | **600** |

De eerste zes helden kosten samen ~2 weken. De **laatste drie kosten samen 22 kisten = 1.100 antwoorden = 59% van de hele reis**. Van de ~37 kisten die een kind opent zijn er **~25 een dubbele**: twee van elke drie kistmomenten leveren geen nieuwe held op.

**Ultra.** Vier reeksstappen × drie dubbelen = twaalf dubbelen, dus dertien exemplaren van dezelfde held.

| doel | kisten (verwachting) | goede antwoorden | weken |
|---|---|---|---|
| één specifieke held naar ultra | 156 | 7.800 | 39 |
| hele collectie in ultra | 234 | 11.700 | 58,5 |
| *(p10 / p90 voor de hele collectie)* | 201 / 272 | 10.050 / 13.600 | 50 / 68 |

**Vergelijking met de oude ladder**, die deterministisch was: twaalf dieren op **1.375** goede antwoorden, alle zestig op **10.975**. Het nieuwe systeem is dus **langzamer naar de volle set** (1.862 vs 1.375) en ongeveer even traag naar volledig ultra (11.700 vs 10.975) — maar met een spreiding die de oude niet had, en met een veel betere kadans in het begin (vaste 50 in plaats van 25, 50, 100, 200, 200, 200…).

**Oordeel: de curve is kapot, maar niet aan het begin.** De eerste twee weken zijn goed afgesteld. Vanaf ongeveer kist 15 kantelt het van verzamelen naar wachten. En het doel dat een kind van tien zélf formuleert — "ik wil Draak in ultra" — kost in verwachting **39 weken**. Voor een achtjarige bestaat een beloning op negen maanden afstand niet. Ultra is in dit ontwerp geen doel maar decor.

### A2(d) De slechtste uitkomst, en de bodem

Kans dat een kind **achtereen** niets nieuws krijgt:

| in bezit | 3 kisten dubbel | 5 | 8 | 10 |
|---|---|---|---|---|
| 6/12 | 13% | 3,1% | 0,4% | 0,1% |
| 9/12 | 42% | 24% | 10% | 5,6% |
| 11/12 | 77% | 65% | 50% | **42%** |

Op 11 van de 12 is tien dubbele kisten op rij niet de pechuitkomst maar de **normale** uitkomst: 500 goede antwoorden, tien keer het ritueel, tien keer niets. En `vol` is erger dan `dubbel`: bij `dubbel` schuift er nog iets op, bij `vol` is de trekking letterlijk weggegooid — en `vol` wordt frequenter naarmate het kind verder komt, dus precies bij het kind dat het hardst gewerkt heeft.

**Ontwerp van de bodem.** Je kunt hier een pity-mechaniek op zetten — "elke derde kist is gegarandeerd nieuw" — en dat werkt, in de zin dat de staart verdwijnt. Maar het maakt de trekking half-deterministisch, en dan is de vraag gerechtvaardigd wat de trekking nog doet. Een pity-mechaniek is de erkenning dat het ongelimiteerde kansmodel niet uitlegbaar is aan het kind dat er pech mee heeft.

Mijn advies is daarom **geen bodem onder de trekking, maar het weghalen van de trekking** — zie A3. Voor de volledigheid, als je ADR-096 tóch houdt, is dit de minimale bodem die ik zou bouwen:

- **Gegarandeerd nieuw bij de derde dubbele op rij**, zolang er nog een onbekende held is. Dat kapt de staart: de langste reeks zonder nieuwe held wordt drie, in plaats van tien-met-42%-kans.
- **`vol` bestaat niet.** Een held die al ultra is wordt overgeslagen in de trekking; de kist trekt uit de niet-volle helden. Dit is één regel in `openKist` en het verwijdert de slechtste van de vier uitkomsten volledig.
- Beide staan dan **in `reis.regel*`**, want een garantie die het kind niet kent, bestaat voor het kind niet.

---

## A3. Het alternatief zonder kans

### Het ontwerp: **kist met drie kaarten**

1. **Bij de start kiest het kind één held uit alle twaalf.** Niet drie krijgen, maar één kiezen uit twaalf. Dat is ADR-067's eigen argument ("three is a choice; one is a default") in zijn sterkste vorm, en het is meteen het eerste scherm van het product.
2. **Elke kist legt drie kaarten open** — drie helden die het kind nog niet heeft, in een vaste volgorde die voor iedereen gelijk is en in `game-core` staat. Het kind draait er één om. Geen trekking, nergens.
3. **Elke kist geeft dus een held die je nog niet had.** Twaalf kisten = twaalf helden = **600 goede antwoorden**, exact, voor elk kind gelijk.
4. **Daarna verandert de kist van functie.** Hij legt drie helden open die nog niet op ultra staan, en het kind kiest welke een stap opschuift. De keuze krijgt dan gewicht: breed uitsmeren of één held doorduwen.
5. **`vol` is per constructie onbereikbaar.** Een held op ultra wordt niet aangeboden.
6. **De keuze verandert wanneer, nooit of.** Wie je favoriet vooraan kiest, schuift de rest op; over twaalf kisten krijg je hoe dan ook alle twaalf. Dat is precies de eigenschap die het eerlijk maakt en toch als zeggenschap voelt.

### Wat dit doet met de curve

| doel | huidig (trekking) | voorstel | verschil |
|---|---|---|---|
| twaalf helden compleet | 1.862 antw. (mediaan 1.750, p90 2.750) | **600**, exact | 3,1× sneller, nul spreiding |
| jouw favoriet naar ultra | 7.800 antw. = 39 weken | **1.200 = 6 weken** | 6,5× |
| alles op ultra | 11.700 = 58,5 weken | **7.800 = 39 weken** | 1,5×, en zonder weggegooide kisten |
| kisten zonder nieuwe held | ~25 van de 37 (68%) | **0** | — |

De scherpste regel: **in het huidige ontwerp koopt 39 weken werk je in verwachting één favoriete held in ultra; in het voorstel koopt diezelfde 39 weken de hele collectie in ultra.**

### De vergelijking, eerlijk

| | huidig: trekking | (b) vaste verborgen volgorde | (c) keuze uit drie — **voorstel** |
|---|---|---|---|
| **Verrassing** | hoog, maar twee van drie keer een teleurstelling | matig: je weet niet wat, wel dat het nieuw is | matig-hoog: drie kaarten, jij draait er één om |
| **Verlangen** | zwak: geen object, want je weet niet wat er bestaat | zwak, om dezelfde reden | **sterk**, als je alle twaalf laat zien (zie B5) |
| **Eerlijkheid** | zwak: p90 is 1,6× de mediaan | sterk | **sterk**: identiek voor elk kind |
| **Uitlegbaar aan een ouder** | "het is toeval, maar gratis" | "hij krijgt ze allemaal, in een vaste volgorde" | **"elke kist geeft een held die hij nog niet had, en hij kiest welke van drie"** |
| **Consistent met de rest** | breekt README + ADR-076/080/081 | herstelt alles | **herstelt alles, nul RNG in het hele product** |
| **Autonomie** | geen | geen | **elke kist een beslissing** |

### Aanbeveling en wat je opgeeft

**Neem (c).** Nul randomness in het hele product, elke kist levert iets, de collectie is in drie weken compleet, en de lange staart verschuift naar de reeksen waar het kind zélf stuurt.

**Wat je opgeeft, eerlijk benoemd:**

- **De jackpot.** Sommige kinderen vinden een zeldzame pull écht spannend, en die piek verdwijnt. Je ruilt een kleine kans op een grote piek in voor het wegnemen van een grote kans op niets. Voor een achtjarige is die ruil goed; voor een vijftienjarige gamer misschien niet.
- **Schaarste als betekenis.** In een trekkingsysteem is een held "zeldzaam" omdat je geluk had. Hier is zeldzaam alleen nog "ik heb er hard aan gewerkt". Dat is een eerlijker maar minder opwindend soort zeldzaamheid.
- **Vergelijkbaarheid tussen broer en zus verdwijnt bijna.** Beiden krijgen alle twaalf; alleen volgorde en reeksen verschillen. Ik zie dat als winst (zie B7), maar het is een verlies aan gespreksstof.
- **Werk.** `openKist` moet worden herschreven en `heldenStore.trek()` verdwijnt. Dat is een dag, inclusief tests — minder dan de twaalf tekeningen.

---

# DEEL B — HET CONCEPT

## B1. De twaalf helden

### De ontwerpregels die het formaat oplegt

Voordat er namen komen: de tekeningen zitten op het §E-frame — 24 raster, één streekdikte, cirkels en rechte lijnen, geen eigen kleur. De bestaande dieren werken omdat **oren** ze op 24 pixels uit elkaar houden. Een superheld met cape en masker is op 24 pixels een vlek.

**Dus: elke held is één onmiskenbare geometrische vorm, niet een kostuum.** Dat is de belangrijkste beperking en ze is productief — het dwingt tot twaalf silhouetten die je van elkaar kunt houden op avatargrootte.

Tweede regel, uit jouw eigen opdracht: **geen held hoort bij een vak.** Topografie, rekenen en klokkijken delen één collectie (ADR-062/063) en er staan er nog vier in de rail. Dus geen kaartlezer, geen rekenmachine, geen klok. De krachten gaan over **manieren van zijn**, niet over schoolvakken — dat werkt ook voor de vier modules die nog niet bestaan.

Derde: de twaalf zijn opgezet als **zes tegenstellingen**. Groot/klein, snel/stil, hard/zacht, licht/koud, groeit/bouwt, onthoudt/brandt. Een kind ziet Reus en Pluis naast elkaar en begrijpt het systeem zonder legenda — dezelfde eis die ADR-080 aan de reeksen stelt.

### De twaalf

| # | Naam | Kracht (één regel) | Silhouet (één regel) | Waarom een kind van 8–12 die wil |
|---|---|---|---|---|
| 1 | **Reus** | Tilt op wat niemand kan tillen. | Schouders breder dan het kader, klein hoofd tegen de bovenrand. | De sterkste. Er is altijd één kind dat alleen de sterkste wil. |
| 2 | **Pluis** | Zo klein en zo licht dat ze overal doorheen past en van elke hoogte veilig landt. | Een klein zacht rond bolletje met twee stipjes, verloren in veel lege ruimte. | Klein zijn is hier een kracht, niet een tekort. Precies het kind dat de kleinste van de klas is. |
| 3 | **Flits** | Heen en terug voordat je opkeek. | Een zigzag waar het lijf hoort, met een klein rond hoofd erop. | De snelste is in elk speelkwartier de meest gevraagde. |
| 4 | **Schim** | Gaat waar het licht niet komt. | Een omtrek van hoofd en schouders, vanbinnen leeg, met een rafelige onderrand. | De sluipende. Het kind dat liever ongezien wint. |
| 5 | **Steen** | Er komt niets langs hem. | Een breed afgerond blok, twee stippen hoog, plat op de grond. | De muur waar je achter kunt staan. Een rol, geen karakter. |
| 6 | **Golf** | Gaat overal omheen en is niet vast te houden. | Een golfkam met een oog in de holte. | Niet te pakken — de tegenpool van Steen, en even cool. |
| 7 | **Vonk** | Maakt licht waar geen licht is. | Een rond hoofd met acht korte stralen. | De eerste die aan gaat. Vindt dingen die verstopt zijn. |
| 8 | **IJs** | Houdt alles één tel stil zodat je goed kunt kijken. | Een zespuntige kristalster met een oog in het midden. | Tijd stilzetten is in elk spel de favoriete kracht. |
| 9 | **Klim** | Laat een ladder of een brug groeien waar er geen is. | Een spiraal met een klein hoofdje aan de punt. | De bouwer-oplosser. Niet vechten, maar erlangs komen. |
| 10 | **Bout** | Repareert alles, zichzelf inbegrepen. | Een afgerond blokhoofd, één groot oog, een moer bovenop. | De robot. Er moet een robot bij. |
| 11 | **Echo** | Zegt terug wat lang geleden gezegd is. | Een hoofd tussen twee open bogen. | Nooit iets vergeten is voor een kind een superkracht, geen schoolvak. |
| 12 | **Vlam** | Brandt door wat in de weg staat. | Een kaak in profiel, één hoorn, één oog — de bestaande draak. | De draak. Er moet een draak zijn en jullie hebben hem al getekend. |

**Namen:** alle twaalf zijn bestaande Nederlandse woorden; elf zijn eenlettergrepig (alleen Echo is twee). Alle twaalf liggen onder AVI-M6 en betekenen wat de tekening doet, dus de naam en het plaatje leren elkaar aan.

**Verantwoording van de spreiding.** Twaalf verschillende rollen, geen twee hetzelfde: tank (Steen), bruiser (Reus), speedster (Flits), stealth (Schim), ontwijker (Golf), verlichter (Vonk), controleur (IJs), bouwer (Klim), hersteller (Bout), geheugen (Echo), damage (Vlam), mobiliteit-door-kleinte (Pluis). Geen twaalf vechters.

**Niet-mannelijk of niet-menselijk:** Pluis (v), Flits (onbepaald), Schim (onbepaald), Golf (niet-menselijk), Vonk (v), IJs (niet-menselijk), Klim (v), Echo (v), Vlam (v, draak) = **negen van de twaalf**. Uitgesproken mannelijk-menselijk: alleen Reus. Steen en Bout zijn niet-menselijk en mannelijk gekleurd. Dat is ruim boven de helft zonder dat het als quotum leest, omdat de meeste helden simpelweg geen mens zijn — wat op 24 pixels ook het beste werkt.

**Eén eerlijk risico:** IJs' kracht ("alles één tel stil") kan als klokkijken lezen. Ik houd hem omdat de formulering over *kijken* gaat en niet over tijd, maar als je dat te dun vindt, is de wissel: "bevriest wat hij aanraakt".

### Het slotverschil dat niemand heeft opgemerkt

In de oude ladder was de draak **de laatste**, en ADR-067 motiveerde dat expliciet: "the last rung should look like the last rung". In ADR-096 is elke held even waarschijnlijk en is er geen laatste meer. **De draak heeft zijn functie verloren en niemand heeft hem een nieuwe gegeven.** In mijn voorstel is dat opgelost doordat de ladder verhuist naar de reeksen: er is geen laatste held, er is een laatste reeks, en die heet ultra.

---

## B2. De vijf reeksen

Brons, zilver, goud, platina, ultra zijn nu vijf kleuren op een plaat. Een kleur alleen is geen opklimming: brons en platina zijn allebei gewoon "een tint", en een kind kan ze pas rangschikken als het de namen al kent.

**Voorstel: de reeks wordt geteld, niet gekleurd.** Om de heldplaat komt **één ring per beklommen trede**.

| Reeks | Plaat | Wat het kind ziet |
|---|---|---|
| brons | kale plaat, met één boog die volloopt | gevonden — en er loopt al iets vol |
| zilver | één gesloten ring, nieuwe boog loopt vol | één keer omhoog |
| goud | twee gesloten ringen | twee keer omhoog |
| platina | drie gesloten ringen | drie keer |
| ultra | vier gesloten ringen, én de held zelf gevuld in plaats van omlijnd | vol — de enige die anders getékend is |

Waarom dit werkt zonder legenda:

- **Meer is verder.** Ringen tellen is het enige rangordesysteem dat geen uitleg nodig heeft. Kleur vereist een afspraak, aantal niet.
- **De boog die volloopt is de drie dubbelen.** Dat is de belangrijkste vondst hier: de voortgang naar de volgende reeks wordt zichtbaar op de held zelf, in dezelfde taal als de `ProgressBar` die het kind al kent. De zwakste uitkomst (`dubbel`) krijgt daarmee een zichtbaar effect — zie B3.
- **Ultra is de enige die van omtrek naar vulling gaat.** Eén visuele gebeurtenis, precies aan het eind, die "dit is het einde" zegt zonder een zin.
- **Drie kanalen in plaats van één**: naam, tint én aantal. Dat is §A's eigen regel ("told apart by name as well as by hue") met een derde erbij, en het helpt bij kleurenblindheid.

**Verhalend**, één regel per reeks, beschrijvend en niet gevoelsturend (de productlijn uit ADR-084): *"Vlam, brons — één ring van drie."* Meer is het niet, en meer hoort het niet te zijn: de opklimming is te zien, dus hij hoeft niet verteld.

**Groottegrens.** Vier concentrische ringen passen niet op 24 pixels. Regel: ringen vanaf 48px (kaart, collectiepagina, resultaatscherm); op 24px (appbalk) blijft het de tint, zoals nu.

---

## B3. Het kistmoment

### Eerst een fout in de huidige implementatie

ADR-084 eist drie dingen: **wát** het is, **uit welke reeks**, en **welk moment het overhandigde**. Geen van de vier bestaande sleutels noemt het moment:

```
'result.heldNieuw':  '{held} komt erbij, in {reeks}'
'result.heldDubbel': '{held} nog een keer: {aantal} van de {totaal} voor {reeks}'
'result.heldHoger':  '{held} gaat naar {reeks}'
'result.heldVol':    '{held} is al ultra'
```

Bij het pakje was dat "niveau 34". Bij de kist is het weggevallen en niemand heeft het gemist. Dat is een schending van een geaccepteerde ADR in geleverde code.

Tweede observatie: `'result.kistEen': 'Je kist gaat open!'` — het uitroepteken is gevoelssturing. Klein, maar dit product schrijft nergens anders zo.

### De teksten

Consistent met A3: het kind kiest, dus de tekst noemt de keuze en niet het lot.

```ts
// Wat een kist opleverde. ADR-084 en ADR-097: wát het is, uit welke reeks, en
// welk moment het overhandigde — hier de hoeveelste kist. Nooit "goed gedaan":
// het product zegt wat er gebeurde, wat je ervan vindt is aan het kind.

'result.kistEen': 'Je kist gaat open.',
'result.kistVeel': 'Je {aantal} kisten gaan open.',
'result.kistKies': 'Kies er één.',

// nieuw — een held die er nog niet was. Altijd brons, altijd nieuw.
'result.heldNieuw': '{held} komt erbij, in {reeks}. Je {kist}e kist.',

// dubbel — de zwakste uitkomst, en de tekst wijst naar het enige dat beweegt:
// de boog om de plaat. Daarom staat het aantal vooraan en niet achteraan.
'result.heldDubbel': '{held}: {aantal} van de {totaal} ringen naar {reeks}. Je {kist}e kist.',

// hoger — de ring is rond. Noem waar hij vandaan komt, anders is "naar goud"
// een mededeling zonder afstand.
'result.heldHoger': '{held} gaat van {vorige} naar {reeks}. Je {kist}e kist.',

// vol — onbereikbaar sinds ADR-097: een held op ultra wordt niet aangeboden.
// Blijft staan als vangnet voor een opgeslagen rij uit een oudere versie.
'result.heldVol': '{held} staat al op ultra.',
```

### Waarom `dubbel` en `vol` hiermee opgelost zijn

**`vol` los je niet op met een betere zin.** Je lost het op door de toestand onbereikbaar te maken. Dat is in mijn voorstel gratis (een volle held wordt niet aangeboden) en in het huidige ontwerp één regel in `openKist`. De beste kopij voor de slechtste uitkomst is: die uitkomst niet hebben.

**`dubbel` los je ook niet op met een betere zin**, maar met iets dat beweegt. Nu krijgt het kind een getal ("2 van de 3") en verder niets; de held op het scherm ziet er exact hetzelfde uit als de vorige keer. Met de boog uit B2 loopt er zichtbaar een stukje ring vol op de plaat — dezelfde beweging als de voortgangsbalk, geen nieuwe animatietaal. Het verschil tussen "dit telde ergens voor" en "dit telde nergens voor" is dat het beeld verandert.

### En een waarschuwing bij ADR-084

ADR-084 staat de unwrap-animatie toe met één argument: *"It is absent almost every time … this card appears a handful of times a month."* Dat was waar bij 25→200 antwoorden per dier. Bij **50 per kist** verschijnt hij ongeveer elke ronde of elke twee rondes, en bij lange rondes twee keer achter elkaar. **Het argument dat de animatie rechtvaardigde is vervallen.** Kies: of de animatie wordt stiller (de boog die volloopt volstaat), of ADR-084 krijgt een nieuwe motivering. Niet allebei laten staan.

---

## B4. Sterren onderweg

Jouw eigen zin — *"ze moeten voortgang zien, ook na 10 goede antwoorden"* — is de belangrijkste in de hele opdracht, en het huidige ontwerp doet er niets mee: de ster bestaat alleen op het resultaatscherm en op `/ontdekkingsreis`.

**Tijdens de ronde: ja, en dit is de hoogste prioriteit van het hele document.** Bij het tiende goede antwoord loopt in de bestaande kop van de ronde een ster vol. Belangrijk detail: **laat hem vullen, niet bewegen.** Een vulling is dezelfde taal als de `ProgressBar` en introduceert dus geen derde animatie in een product dat er bewust twee heeft (ADR-084). Geen modal, geen onderbreking, geen geluid.

**Op het resultaatscherm: ja, staat er al.** `Beloning.tsx` toont de vijf sterren en `result.sterStand`. Ongewijzigd.

**In de rechterkolom: ja — en hier is de ruil.**

De kolom heeft nu vier blokken: toetsen, voortgang, goed, favorieten. Het voortgangsblok bevat: heldplaat, "Niveau N", reeksnaam, balk (niveauvoortgang), "x van de 12", "nog X goede antwoorden tot niveau N+1", knop naar de collectie.

| | wat |
|---|---|
| **Erbij (één element)** | de sterrenrij — vijf sterren, zoveel gevuld als de volgende kist heeft. De component bestaat al: `Sterren` uit `Beloning.tsx`. **Nul nieuwe code.** |
| **Wat wijkt** | de **niveaubalk** en de zin **"nog X goede antwoorden tot niveau N+1"**. De balk gaat de kist meten, de zin wordt **"Nog X goede antwoorden tot je kist."** (`reis.totKist` bestaat al, met exact die tekst.) |
| **Wat blijft** | heldplaat met reeksringen, reeksnaam, "x van de 12", knop naar de collectie. |
| **Wat er met het niveau gebeurt** | het niveaugetal blijft staan als stille levenslange teller naast de reeksnaam, maar telt nergens meer naar af. |

**Waarom dit de goede ruil is, en niet alleen de goedkoopste.** Er staan nu twee ladders in dezelfde eenheid (goede antwoorden) op dezelfde kaart, en sinds ADR-096 deelt er één niets meer uit. Twee tellers voor hetzelfde is precies waar ADR-071's eigen consequentie tegen waarschuwt ("a second copy of the same rule, which is how two of them come to disagree") en waar ADR-058 de prognose om van de voordeur haalde ("a second opinion about the same thing"). De kolom moet aftellen naar de gebeurtenis die iets uitdeelt. Dat is de kist.

**De radicalere variant, die ik noem en niet aanbeveel voor deze week:** haal het niveau helemaal weg. ADR-070 gaf het niveau bestaansrecht als "a promise about work"; die belofte wordt sinds ADR-096 niet meer ingelost. Dat verdient een eigen ADR en een eigen beslissing, niet een bijzaak in deze knip.

---

## B5. Avatar en autonomie

### Het probleem met de start zoals hij nu is

`uitLadder(0)` geeft een nieuw kind `earnedAt(levelFor(0)=1) = 3` helden op `plek` 0, 1 en 2: altijd kat, uil en vos. **Elk kind ter wereld begint met dezelfde drie.** ADR-059/067's argument was autonomie ("a child who cannot change anything about an app they are told to use can at least decide what it looks like"), maar een keuze uit drie die voor iedereen dezelfde drie zijn, is nauwelijks een keuze — en het is niet wat ADR-067 bedoelde.

### Voorstel: kies je eerste held uit alle twaalf

Het eerste scherm na de naam toont **alle twaalf, met naam en tekening**, en het kind kiest er één. Die is meteen zijn avatar.

Dat betekent **ADR-081 omdraaien voor de helden**: niet twaalf pakjes, maar twaalf helden op tafel. Mijn argument, en het is precies jouw H3:

- ADR-081's zorg was reëel maar ging over **zestig dieren over achtenvijftig niveaus** — daar is "je kunt de hele collectie op je eerste middag uitlezen en dan veertig niveaus lang dingen ontvangen die je al kende" een echte kwaal.
- Twaalf helden over twaalf kisten (drie weken) is een ander ding. Hier is de zichtbaarheid geen spoiler maar **het object van verlangen**. Je kunt niet naar iets verlangen wat je niet kent. Dat is de Pokédex-regel: het schema toont wat er bestaat, en juist dáárom wil je ze allemaal.
- De verrassing die overblijft is welke van de drie kaarten je omdraait, wanneer je favoriet langskomt, en hoe ver je hem krijgt. Dat is genoeg verrassing en het is de goede soort: verrassing over volgorde, niet over uitkomst.

### Broer en zus op één apparaat

`activeChildId()` sleutelt de rij in `settings`, dus de collecties zijn al volledig gescheiden — goed gebouwd, niets aan doen.

**Wat zien ze van elkaar? Mijn advies: niets, en dat is een ontwerpbeslissing, geen luiheid.** Een kind van tien en een kind van acht die elkaars collectie zien, is één zichtbare race waarvan de uitslag vooraf vaststaat. Het kind van acht verliest hem elke dag. Voor een product dat een dagelijkse gewoonte moet bouwen bij precies dat kind is dat het snelste gif dat er is. Wat wél mag: bij het wisselen van kind staat de gedragen held naast de naam, zodat je ziet wie je kiest. Dat is herkenning, geen vergelijking.

### Waar autonomie verder zit

1. **De eerste held**, uit alle twaalf.
2. **Elke kist een keuze** uit drie — twaalf beslissingen in de eerste drie weken.
3. **Na de twaalf: welke held je doorduwt.** Dit is de enige echte strategische beslissing in het product: breed uitsmeren of één held naar ultra. Voor een tienjarige is dat een goede vraag.
4. **Welke held je draagt**, altijd wisselbaar, uit alles wat je hebt — ADR-096 breidde dat al uit voorbij de eerste rij, en dat blijft.
5. **Hoe lang een ronde duurt** (ADR-074) en wat je oefent. Bestaat al.

---

## B6. Wat er met de dieren gebeurt

**Advies: vervangen, niet naast elkaar laten bestaan.**

Argumenten:

- **Twee collecties is twee ladders in één smalle kolom.** Dat is exact het patroon dat ADR-058 van de voordeur haalde en ADR-071 in zijn consequentie-alinea verwerpt.
- **De dieren droegen nooit betekenis.** Ze waren eerst een keuze (ADR-059), toen een niveausport (ADR-067). Een held draagt betekenis: een kracht waar een kind een voorkeur over vormt. Dat is het enige inhoudelijke argument vóór de hele omzetting, en het verdampt als je er twaalf betekenisloze dieren naast laat staan.
- **Kosten:** naast elkaar betekent 24 tekeningen, 24 i18n-namen, een tweede as op de collectiepagina, en een tweede vraag bij elke kist ("wat komt eruit, een dier of een held?").
- **De migratie doet het al 1-op-1.** `uitLadder` mapt `plek` op `plek`; er is geen datamodelreden om ze te scheiden.

**Wat een kind dat de dieren wél leuk vond verliest — eerlijk:** het specifieke dier dat het droeg. Voor een achtjarige die zes weken lang "de vos" was, is dat een echt verlies, ook al klopt de migratie technisch.

**Twee verzachtingen, allebei goedkoop:**

1. **Laat de silhouetten rijmen.** Kies de mapping zo dat de held op dezelfde plek iets van het dier meeneemt:

| plek | dier | held | rijm |
|---|---|---|---|
| 0 | kat | **Schim** | sluipt |
| 1 | uil | **Echo** | hoort, onthoudt |
| 2 | vos | **Flits** | snel, sluw |
| 3 | beer | **Steen** | onverzettelijk |
| 4 | haas | **Pluis** | licht, springt |
| 5 | vis | **Golf** | water |
| 6 | egel | **Bout** | stekels, metaal |
| 7 | kikker | **Klim** | klimt, springt |
| 8 | eekhoorn | **Vonk** | (zwak rijm — willekeurig) |
| 9 | pinguïn | **IJs** | ijs |
| 10 | olifant | **Reus** | groot |
| 11 | draak | **Vlam** | dezelfde draak, met een naam |

Zes van de twaalf rijmen sterk, en de draak blijft letterlijk de draak.

2. **Zeg het één keer, in het product.** Eén regel bij de eerste keer openen: *"De dieren zijn helden geworden. Jouw vos is nu Flits."* Niet als nieuwsbericht, gewoon als mededeling — dezelfde toon als de rest.

---

## B7. Exploits en randgevallen

| # | Geval | Oordeel |
|---|---|---|
| 1 | **Meerkeuze doorklikken tot het goed is** | **De grootste openstaande exploit, en hij is nu live.** Bij vier opties levert doorklikken vrijwel gegarandeerd een "goed" op. Een ronde van 50 vragen wordt dan een kist, ongeacht kennis. Regel die moet gelden: **alleen het eerste antwoord op een vraag telt voor `correct`.** *Ik heb de antwoordregistratie zelf niet gelezen* — `ADR-043` noemt vier antwoordtoestanden, dus mogelijk is dit al goed. **Verifieer dit vóór alles.** Als het niet klopt is de hele economie stuk en heeft geen enkele curve-analyse nog betekenis. |
| 2 | **Ontdekken-modus** | Stelt geen vragen, levert dus geen antwoorden en geen sterren. Correct door constructie. Verifieer dat er geen `attempts` worden weggeschreven. |
| 3 | **Toetsstand** | Moet meetellen. Het is echt werk en het is de eerlijkste modus in het product; die uitzonderen zou de enige modus zonder hulp ook de enige modus zonder beloning maken. Gokken kost je daar het cijfer, en dat is waar die modus voor is. |
| 4 | **Ronde halverwege gestopt** | **Al goed opgelost, en netjes.** `openVerdiend` vergelijkt `kistenOpen` met `kistenVoor(correct)`, dus een kist die verdiend maar niet geopend is, komt aan het eind van de volgende ronde alsnog. Niets aan doen. |
| 5 | **Meerdere kisten in één lange ronde** | `openVerdiend` loopt door en `Beloning` rendert een lijst — functioneel correct. Maar twee unwraps achter elkaar plus de vervallen zeldzaamheid uit ADR-084 (zie B3) maken dit een presentatieprobleem. Bij drie of meer: toon ze als lijst zonder animatie, met alleen de laatste uitgepakt. |
| 6 | **Alles op ultra (60/60)** | Bereikbaar: 7.800 goede antwoorden in mijn voorstel, ~1 jaar bij dit tempo. **Er is nu geen eindtoestand ontworpen** — de kist blijft `vol` teruggeven. Ontwerp: de sterrenrij in de kolom wordt vervangen door de levenslange teller, de collectiepagina zegt dat hij compleet is, en er komt géén zesde reeks — "ultra" is gekozen omdat het einde betekent (ADR-080) en dat woord moet je niet verraden. |
| 7 | **Twee kinderen op één apparaat** | Opslag is al per kind gescheiden (`helden:<kindId>`). Zie B5: niets van elkaar tonen. |
| 8 | *(erbij)* **Systeemklok verzetten** | Raakt de dagstreak, niet de kisten — die hangen alleen aan goede antwoorden. Dat is een structureel voordeel van "alles in goede antwoorden" dat je mag opschrijven. |
| 9 | *(erbij)* **Een korte set eindeloos herhalen** | Twaalf provincies twintig keer op rij geeft 240 goede antwoorden zonder iets te leren. De Leitner-planner beschermt de leerinhoud, maar niet de economie. Overweeg: alleen antwoorden op items die niet in dezelfde sessie al goed waren, tellen voor een ster. Dat is dezelfde regel als #1, één niveau hoger. |

---

## B8. Meten

### Wat erbij komt in IndexedDB (DATAMODEL.md deel A)

Er is al een rij in `settings` onder `helden:<kindId>` met `{ helden[], kistenOpen }`. Toe te voegen, minimaal:

```ts
// settings: key `helden:<kindId>`
{
  helden: [{ plek, reeks, dubbelen }],   // bestaat
  kistenOpen: number,                    // bestaat
  gekozen: number[],                     // NIEUW: welke plek het kind per kist koos
}
```

Eén veld. `gekozen` is onder ADR-097 het enige signaal dat niet uit iets anders is af te leiden, en het is het interessantste: **wat wíl dit kind?** Alles over volume, frequentie en correctheid zit al in `attempts` (append-only sinds v1, met `tijdstip`, `correct`, `itemId`, `mode`).

Geen tijdstempel op de kist: `attempts.tijdstip` heeft het al, en een tweede kopie is een tweede waarheid.

### De ene meetwaarde

**Goede antwoorden per kind per week.** Niet kisten, niet helden, niet percentage goed — die zijn in mijn voorstel per constructie gegarandeerd en meten dus alleen dat de code werkt. Niet speeltijd: een kind dat langer naar hetzelfde scherm staart is geen succes.

Tweede-beste, als controle: **dagen per week met minstens één afgeronde ronde.** Volume zonder frequentie kan één zaterdagmiddag zijn; de gewoonte is het doel.

### Hoe je dat meet zonder tracking te bouwen

**Het belangrijkste inzicht: je nulmeting bestaat al.** `attempts` staat sinds v1 op het apparaat en is append-only. Je kunt de acht weken vóór de verandering retroactief uitlezen. Je hoeft niets te bouwen om een referentie te hebben — je moet alleen kijken.

Concreet, en volledig binnen de belofte (lokaal, geen server, geen analytics, geen nieuwe verzameling):

1. **Een leesvenster in het bestaande ouderblok** op "Jij" (ADR-079). Een tabel uit `attempts`: ISO-week | goede antwoorden | dagen geoefend | rondes. Read-only, per kind, alleen op het apparaat.
2. **Kopieerbaar als tekst.** Één knop die die tabel naar het klembord zet, zodat je hem in een spreadsheet plakt. Geen export-bestand, geen upload.
3. **Geen enkel nieuw datapunt.** Alles komt uit rijen die er al staan. Dit is een *view*, geen *meting* — en dat verschil is precies wat het verenigbaar maakt met de README-claim.

**Leesregel voor jezelf, vooraf vastleggen zodat je jezelf niet overtuigt:** je vergelijkt de vier weken ná de verandering met de vier weken ervóór, per kind, op goede antwoorden per week. Nieuwigheid geeft in week 1 altijd een piek. **Als de winst in week 3 en 4 weg is, was het de nieuwigheid en niet het ontwerp.** Schrijf dat op vóór je begint.

---

## B9. De knip

### Deze week — en geen van deze punten heeft een heldentekening nodig

| # | Wat | Waarom nu |
|---|---|---|
| 0 | **Verifieer en repareer de meerkeuze-exploit** (B7 #1) | Blokkeert alles. Zonder dit is elk getal in dit document betekenisloos. |
| 1 | **Ster vult tijdens de ronde, bij elk tiende goede antwoord** | De hoogste verwachte opbrengst per uur werk in het hele document. En het is jouw eigen hypothese. |
| 2 | **Rechterkolom richt zich op de kist** (B4) | Eén bestaande component verplaatsen, één bestaande i18n-sleutel hergebruiken. |
| 3 | **`openKist` wordt keuze uit drie** (ADR-097) | Puur, in `game-core`, testbaar. `heldenStore.trek()` verdwijnt. |
| 4 | **`vol` wordt onbereikbaar** | Eén regel, verwijdert de slechtste uitkomst. Ook waardevol als je 3 níét doet. |
| 5 | **De vier resultaatteksten** met het moment erin (B3) | i18n-only. Herstelt naleving van ADR-084. |
| 6 | **README + ADR-097/098/099** | Zolang dit blijft staan is de repo publiek onjuist. Dit is de goedkoopste post op de lijst. |

Alles hierboven werkt **met de twaalf bestaande dierentekeningen en de bestaande namen**. Dat is het antwoord op "wat kan mee zonder dat de helden-tekeningen af zijn": alles wat ertoe doet.

### Daarna

| Wanneer | Wat |
|---|---|
| Volgende week | De twaalf heldentekeningen + namen in i18n + de mapping uit B6. |
| Daarna | De ringen per reeks (B2) op `Heldplaat`. |
| Daarna | "Kies je eerste held uit twaalf" als startscherm (B5). |
| Daarna | De eindtoestand bij 60/60 (B7 #6). |
| Los, wanneer je wilt | Het leesvenster voor de ouder (B8). Kan ook eerst — dan heb je week 1 al gemeten. |

**Waarom deze volgorde ook de juiste test is.** Als 0–5 alleen al het weekgetal beweegt, was het thema nooit het probleem en zijn de helden een verbetering in plaats van een redding. Dat weet je binnen twee weken, vóórdat je een weekend in twaalf tekeningen steekt. Als het weekgetal níét beweegt, weet je dat H1 overblijft en ga je met veel meer vertrouwen tekenen.

---

# DEEL C — OPLEVERING

## C1. ADR-concepten (Engels, in de stijl van `docs/DECISIONS.md`)

---

```markdown
## ADR-097 — A chest always gives a hero you do not have, and the child picks from three

**Status:** proposed — 2026-09-11. **Reverses the draw in ADR-096** and restores
spec §4.5 and ADR-067's first condition. Keeps everything else ADR-096 decided:
the fifty-answer chest, the twelve heroes, the five reeksen, the migration.

### Context

ADR-096 made which hero a chest holds a draw, knowingly and against spec §4.5.
What was not on the table when that was decided is what the draw costs in
answers, and it is not small.

Twelve heroes, uniform, fifty correct answers a chest: completing the set takes
**37.2 chests in expectation — 1,862 correct answers** — with a standard
deviation of 13.7 chests. The median is 35 chests and the ninetieth percentile
is 55, so two children working equally hard are four months apart. About
**twenty-five of those thirty-seven chests hold a hero the child already has.**
The last three heroes alone cost 22 chests, which is 59% of the whole set.

Past the set it is worse. Four reeks steps at three duplicates each means
thirteen copies of one hero, so **one named hero at ultra costs 156 chests —
7,800 correct answers, thirty-nine weeks at four sessions of fifty a week.** A
child of eight does not have a thirty-nine week horizon. "I want Vlam in ultra"
is the goal the game invites and the goal it cannot pay.

And the worst case is not rare. Holding eleven of twelve, the chance that ten
consecutive chests are all duplicates is **42%**. That is five hundred correct
answers and ten openings that hand over nothing. `vol` — a duplicate of a hero
already at ultra — hands over less than nothing, and it gets more frequent the
harder a child has worked.

Three accepted decisions also say the opposite of what the code now does:
ADR-076 ("bought with correct answers and nothing else"), ADR-080 ("nothing
behind money, chance or waiting") and ADR-081 ("nothing in this product is ever
earned by chance or by waiting"). ADR-096 revised ADR-067 and spec §4.5 and
named neither of these three.

### Decision

**A chest opens three cards, and the child turns one over.**

- Until the twelve are held, the three are heroes this child does not have,
  taken in a fixed order that is the same for every child and lives in
  `game-core`. **Every chest gives a hero you did not have.** Twelve chests,
  twelve heroes, **six hundred correct answers**, identical for every child.
- Once the twelve are held, the three are heroes not yet at ultra, and the
  child picks which one takes the duplicate. That is the only strategic
  decision in the product: spread, or push one hero to ultra.
- **`vol` becomes unreachable.** A hero at ultra is never offered. The
  translation key stays as a guard for a row written by an older version.
- **The choice changes when, never whether.** Taking a favourite first shifts
  the rest forward; over twelve chests the child gets all twelve either way.

**No randomness anywhere in the product.** `heldenStore.trek()` is deleted and
with it the only call to `crypto.getRandomValues` in the reward path. `openKist`
takes a chosen index rather than a number in [0,1) and stays pure.

**The first hero is chosen from all twelve** rather than handed out as a fixed
three (ADR-098 covers what the twelve are, and why showing them is the point).

### Consequences

The numbers move as follows, at fifty correct answers a chest:

| | ADR-096 | this |
| --- | --- | --- |
| all twelve heroes | 1,862 answers (p90 2,750) | **600, exact** |
| one chosen hero at ultra | 7,800 | **1,200** |
| every hero at ultra | 11,700 | **7,800** |
| chests holding nothing new | ~25 of 37 | **0** |

`README.md`, ADR-076, ADR-080 and ADR-081 become true again rather than needing
amendment. Spec §4.5 is no longer revised by anything.

What is given up: the jackpot. A rare pull is a real thrill and it is gone. The
trade is a small chance of a large spike against a large chance of nothing, and
for an audience of eight it is the right way round. Scarcity now means "I worked
for this" rather than "I was lucky", which is honest and less exciting.

`reis.regel2` and `reis.regel3` are rewritten: the page can now say a chest
always gives a hero you do not have, which is a better sentence than "alle
twaalf zijn even kansrijk" in every way that matters.
```

---

```markdown
## ADR-098 — Twelve heroes, none of which belongs to a module, and the animals are replaced

**Status:** proposed — 2026-09-11. Completes ADR-096, which named twelve heroes
and shipped twelve animals. Retires the drawings ADR-059 and ADR-067 introduced.

### Context

ADR-096 replaced the ladder of sixty animals with heroes and then used the
twelve animal drawings as the heroes, on the argument that "the handoff's 24
would need twelve more illustrations". So the product now calls a hedgehog a
hero. There is no name, no power and no drawing for any of the twelve.

Two constraints shape what they can be. **The frame:** §E is a 24 grid, one
stroke weight, circles and straight lines, no colour of its own. The animals
work at that size because ears tell them apart; a hero in a cape and mask is a
smudge. **The modules:** topografie, rekenen and klokkijken share one collection
(ADR-062, ADR-063) and four more modules stand in the rail. A hero that belongs
to arithmetic breaks that, and breaks it again for every module not yet built.

### Decision

**Twelve heroes, each one unmistakable shape rather than a costume**, and each
power a way of being rather than a school subject.

| # | Name | Power | Silhouette |
| --- | --- | --- | --- |
| 1 | Reus | lifts what nobody can lift | shoulders wider than the frame, small head at the top edge |
| 2 | Pluis | small and light enough to pass anywhere and land from any height | a small soft circle with two dots, alone in empty space |
| 3 | Flits | there and back before you looked up | a zigzag body with a small round head |
| 4 | Schim | goes where the light does not | an outline of head and shoulders, empty inside, ragged below |
| 5 | Steen | nothing gets past him | a wide rounded block, two dots high, flat on the ground |
| 6 | Golf | goes round anything and cannot be held | a wave crest with an eye in the hollow |
| 7 | Vonk | makes light where there is none | a round head with eight short rays |
| 8 | IJs | holds everything still for a moment so you can look | a six-pointed crystal with an eye at its centre |
| 9 | Klim | grows a ladder or a bridge where there is none | a spiral with a small head at its tip |
| 10 | Bout | repairs anything, himself included | a rounded block head, one large eye, a nut on top |
| 11 | Echo | says back what was said long ago | a head between two open arcs |
| 12 | Vlam | burns through what is in the way | a jaw, one horn, one eye — the dragon already drawn |

**Six pairs of opposites**: large/small, fast/silent, hard/soft, light/cold,
grows/builds, remembers/burns. A child seeing Reus beside Pluis reads the system
without a legend, which is the rule ADR-080 applies to the reeksen.

**All twelve are ordinary Dutch words**, eleven of one syllable, every one at or
below AVI-M6, and each means what the drawing does — so name and picture teach
each other.

**Nine of the twelve are not male-human**: five female, two unspecified, four
non-human (two of those male-coded). Only Reus is a man. This falls out of the
frame rather than being imposed on it: at 24 pixels a shape reads better than a
person.

**Twelve roles, no two alike**: tank, bruiser, speedster, stealth, evader,
illuminator, controller, builder, repairer, memory, damage, and mobility by
being small.

**The animals are replaced, not kept alongside.** Two collections would be two
ladders in the same narrow column, which is what ADR-058 took off the front door
and what ADR-071's own consequences warn about. The mapping keeps the slot, so
`uitLadder` is unchanged, and it rhymes where a rhyme exists: cat→Schim,
owl→Echo, fox→Flits, bear→Steen, hare→Pluis, fish→Golf, hedgehog→Bout,
frog→Klim, squirrel→Vonk, penguin→IJs, elephant→Reus, dragon→Vlam. Six rhyme
strongly and the dragon stays the dragon.

**There is no last hero any more.** ADR-067 made the dragon twelfth because "the
last rung should look like the last rung". Under ADR-096 every hero is equally
reachable and under ADR-097 all twelve arrive within twelve chests, so that job
is gone. The ladder is the reeksen now, and its last rung is ultra.

### Consequences

Twelve new drawings in `Stickers.tsx` and twelve keys in `nl.ts`. `stickerSet.ts`
keeps its shape: a list of twelve in the order they are offered, and nothing
about earning them.

A child who wore an animal loses that drawing. The slot, the reeks and the
duplicates survive the change; the picture does not. The product says so once,
plainly, on first open: "De dieren zijn helden geworden. Jouw vos is nu Flits."

Nothing in this decision is needed before the loop changes in ADR-097 and
ADR-099 can ship. Those work with the twelve animals exactly as they are, which
is deliberate: the heroes should be judged after the loop is known to work, not
instead of finding out.
```

---

```markdown
## ADR-099 — The star is visible where the work is done, and the column counts to the chest

**Status:** proposed — 2026-09-11. Amends ADR-096 and ADR-070. Does not remove
the level; re-aims what the column counts towards.

### Context

Since ADR-096 a level hands nothing out. `collection.ts` says so in its own
header comment: "Since ADR-096 this ladder hands nothing out." The right-hand
column, which stands on every screen inside the shell, still counts down to it:
"Nog 6 goede antwoorden tot niveau 7." That sentence is ADR-070's whole reason
for existing — "a level is a promise about work" — and the promise is no longer
paid.

Meanwhile the event that does hand something over, the chest at every fifty
correct answers, is on no persistent surface at all. ADR-096 keeps the stars off
the front door on purpose: "they are on the screen after a round and on the
collection page."

So the one progress object a child sees all day counts towards nothing, and the
one that counts is invisible between rounds. That is the shape of the problem
the September redesign set out to solve, rebuilt in the solution.

Two ladders in the same unit on the same card is also the pattern this product
keeps rejecting: ADR-058 took the forecast off the front door because beside a
mark it read as "a second opinion about the same thing", and ADR-071's
consequences call a second copy of one rule "how two of them come to disagree".

### Decision

**One new element in the column, and one thing gives way.**

- **In:** the five-star row. It is `Sterren` from `Beloning.tsx`, unchanged — no
  new component and no new colour.
- **Out:** the level progress bar and "Nog {n} goede antwoorden tot niveau
  {n+1}". The bar now measures the chest, and the sentence becomes
  `reis.totKist`, which already exists and already reads "Nog {aantal} goede
  antwoorden tot je volgende kist."
- **Unchanged:** the hero plate, the reeks name, "x van de 12", the way to the
  collection. The level number stays beside the reeks name as a lifetime figure
  and counts towards nothing, because that is what it now is.

**A star fills during the round**, at every tenth correct answer, in the round's
existing header. **It fills; it does not move.** A fill is the language of
`ProgressBar` and therefore not a third animation in a product that has two on
purpose (ADR-084). No modal, no interruption, no sound.

**On the result screen nothing changes.** `Beloning` already shows the row.

### Consequences

A child now sees something move every ten correct answers, on every screen,
between rewards. That is the gap the old ladder left: from level five onwards a
rung cost two hundred correct answers, which at four sessions of fifty a week is
one animal a week with six days of nothing in between.

ADR-070's level survives as a measure and stops being a promise. Whether it
should survive at all is a separate question and deserves its own ADR; deciding
it inside a change about stars would be deciding it by accident.

One thing this breaks that should be recorded: **ADR-084 allows the unwrap
animation because it is rare** — "this card appears a handful of times a month".
At fifty correct answers a chest it appears roughly every round or two. Either
the animation gets quieter or ADR-084's justification is rewritten. Both cannot
stand.
```

---

## C2. README-passages die nu feitelijk onjuist zijn

Regelnummers naar de huidige `README.md`. Vervangende tekst is geschreven **onder ADR-097** (dus zonder kans); waar het verschil uitmaakt staat de variant-als-je-ADR-096-houdt eronder.

---

**1. Regel 132–135** — het aantal en het soort

> *Nu:* "The whole of it is at **leer.nu/voortgang**: sixty animals in five materials — brons, zilver, goud, platina, ultra (ADR-080) — twelve tafeldiploma's and ten reisstempels, with what every one of them costs written next to it (ADR-071, ADR-076)."

> **Voorstel:** "The whole of it is at **leer.nu/ontdekkingsreis**: twelve heroes in five reeksen — brons, zilver, goud, platina, ultra ([ADR-080], [ADR-098]) — twelve tafeldiploma's and ten reisstempels, with what every one of them costs written next to it."

*(Let ook op: de README zegt `/voortgang`, ADR-076 zegt `/ontdekkingsreis`. Eén van de twee is fout — verifieer de route.)*

---

**2. Regel 135–139** — het pakje

> *Nu:* "What it does not say is what the next animal _is_: an animal not yet earned is drawn as a parcel with its price on it, so a child can aim at the next rung without having read the whole collection off the screen on their first afternoon (ADR-081)."

> **Voorstel:** "All twelve heroes are on it by name from the first minute, and a child picks the one they start as ([ADR-098]). Sixty parcels over fifty-eight levels was a collection you could read off the screen in an afternoon and then spend forty levels re-meeting; twelve heroes over twelve chests is the opposite problem, and you cannot want what you have not seen. What the page does not say is which hero the next chest will offer."

---

**3. Regel 139–142** — het moment en de frequentie

> *Nu:* "The parcel is opened at the end of the round that earned it — the one moment of movement in this product that is a reward rather than a lesson, and one that happens a handful of times a month (ADR-084)."

> **Voorstel:** "Ten correct answers are a star, five stars a chest, and a chest is opened at the end of the round that earned it — the one moment of movement in this product that is a reward rather than a lesson. A chest holds a hero the child does not have, and the child picks one of three ([ADR-097])."

*(Het "a handful of times a month" moet hoe dan ook weg: bij 50 goede antwoorden per kist is het elke ronde of twee.)*

---

**4. Regel 142–143** — de belofte. **De belangrijkste.**

> *Nu:* "Nothing on that page can be bought, won by chance or reached by waiting, and nothing on it mentions a date."

> **Voorstel onder ADR-097** (ongewijzigd houden, want weer waar) — maar met één zin eraan vast, omdat de claim nu sterker is dan hij was: "Nothing on that page can be bought, won by chance or reached by waiting, and nothing on it mentions a date. There is no random number anywhere in the reward path: twelve chests hold twelve heroes, the same twelve for every child, and the choosing is the child's."

> **Variant als je ADR-096 houdt** (en dan hoort deze in alinea 3, bij "why this repository is public", niet hier achteraan): "Nothing here can be bought, and nothing arrives by waiting. One thing is decided by chance and only one: **which** of the twelve heroes a chest holds. Whether there is a chest, and what it costs, is arithmetic on correct answers — fifty of them, and nothing else moves it. Every hero is equally likely, the app says so to the child in those words, and the draw is in `heldenStore.ts` where you can read it."

---

**5. Regel 127–130** — de rechterkolom

> *Nu:* "'Jouw voortgang' is the level a child has reached, the rung of the ladder they are on, and one line saying what the next one costs, in the only unit that means anything to them: 'nog 6 goede antwoorden' (ADR-070)."

> **Voorstel:** "'Jouw voortgang' is the hero a child wears, which reeks it stands in, and one line saying what the next chest costs, in the only unit that means anything to them: 'nog 6 goede antwoorden' ([ADR-099]). Five stars stand beside it, as many filled as the next chest has. The level is still counted and still shown, and it is a measure of work done rather than a promise about what is coming."

---

**6. Nieuwe alinea — de omissie**

De README beschrijft de hoofdloop van het product nergens. Er staat geen woord over sterren, kisten of helden. Voorstel, in te voegen vóór de collectie-alinea:

> "What a round is worth is counted in one thing and counted the same everywhere: correct answers. Ten of them are a star, five stars are a chest, and a chest holds one of the twelve heroes — one the child does not have yet, chosen by them from three ([ADR-097]). Three duplicates carry a hero up a reeks, bronze to ultra, so the collection is twelve heroes and sixty plates. Nothing else moves it: not money, not chance, not a day of the week."

---

**7. ADR's die geamendeerd moeten worden, los van de README**

| ADR | Wat er staat | Wat eraan moet |
|---|---|---|
| ADR-076 | "Everything on the page is bought with correct answers and nothing else" | onder ADR-097 weer waar — wel het aantal (zestig dieren → twaalf helden) corrigeren |
| ADR-080 | "nothing behind money, chance or waiting" | onder ADR-097 weer waar — geen wijziging |
| ADR-081 | "nothing in this product is ever earned by chance or by waiting" | onder ADR-097 weer waar; de *pakjes*-beslissing zelf wordt door ADR-098 voor de helden teruggedraaid en dat moet erbij |
| ADR-084 | "It is absent almost every time … a handful of times a month" | **vervallen argument**, ongeacht welke kant je op gaat. Moet herschreven of de animatie moet stiller |
| ADR-067 | eerste voorwaarde ("nothing behind money or chance") | onder ADR-097 hersteld; ADR-096's revisie vervalt |

---

# Slot

## Eén aanbeveling

**Haal de trekking eruit en maak de ster zichtbaar — in die volgorde van belang, maar in dezelfde week.** Concreet: een kist legt drie helden open die het kind nog niet heeft en het kind kiest er één (ADR-097), de rechterkolom telt af naar de kist in plaats van naar een niveau dat niets uitdeelt, en er loopt een ster vol bij elk tiende goede antwoord (ADR-099). Dat kost ongeveer een dag werk, heeft geen enkele nieuwe tekening nodig, maakt vier documenten weer waar in plaats van ze te moeten amenderen, en verandert "mijn favoriete held in ultra" van een doel op negen maanden in een doel op zes weken.

De twaalf helden (ADR-098) zijn een goede investering — maar doe ze pas als de loop gemeten beter is, want dan weet je of je ze bouwt omdat ze helpen of omdat je kinderen ernaar vroegen.

## De drie grootste risico's

1. **De meerkeuze-exploit maakt elke berekening in dit document irrelevant.** Als doorklikken tot het goed is als "goed" telt, is een kist niet vijftig goede antwoorden maar vijftig keer klikken, en dan meet je straks niets. *Niet geverifieerd — ik heb de antwoordregistratie niet gelezen.* Dit moet vóór alles.

2. **Je meet de nieuwigheid en niet het ontwerp.** Elke verandering geeft bij twee kinderen in week 1 een piek. Als je op grond van week 1 concludeert, concludeer je over de verandering-op-zich. Leg je leesregel vast vóór je begint: week 3 en 4 tellen, week 1 niet.

3. **Twee kinderen zijn geen steekproef, en jouw kinderen zijn niet de markt.** Alles in dit document is afgestemd op een kind van 8 en een kind van 10 in jouw huis. Dat is de juiste keuze voor nu — maar ADR-096 is ontstaan uit één gesprek met twee kinderen, en dit document dreigt op dezelfde manier te ontstaan. Het verschil dat je kunt maken is dat je deze keer méét in plaats van luistert, en dat de meting al op het apparaat staat.

*Eén risico dat ik bewust niet in de top drie zet: het juridische. Dat is er niet — de Raad van State-uitspraak van 9 maart 2022 sluit het kansspelspoor af en PEGI raakt alleen betaalde mechanismen. Het risico is reputationeel en pedagogisch, en dat is een ander soort risico dat je niet met een juridisch advies wegneemt.*

## De eerstvolgende stap

**Lees vandaag `attempts` uit voor beide kinderen, per week, over de afgelopen acht weken: goede antwoorden en dagen geoefend.** Die data staat er al. Zonder die twee kolommen heb je over vier weken een gevoel en geen antwoord, en dan zit je precies waar ADR-096 ontstond.

Direct daarna: verifieer of een tweede klik in meerkeuze als "goed" wordt geregistreerd.

---

## Bronnen

- [Dwangsom onterecht opgelegd: 'loot boxes' in computerspel FIFA22 zijn geen kansspel — Raad van State, 9 maart 2022](https://www.raadvanstate.nl/@130206/dwangsom-onterecht-opgelegd-loot-boxes/)
- [Uitspraak Raad van State in FIFA-zaak: dwangsom aan EA onterecht — Kansspelautoriteit](https://kansspelautoriteit.nl/nieuws/2022/maart/uitspraak-raad-state-fifa-zaak-dwangsom/)
- [Commission publishes guidelines on the protection of minors (DSA art. 28), 14 juli 2025 — Europese Commissie](https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-protection-minors)
- [PEGI launches "interactive risk categories" — Reed Smith](https://www.reedsmith.com/articles/pegi-launches-interactive-risk-categories-overhauls-age-ratings-for-loot-boxes-in-game-spending-and-communication-features/)
- [Digital Fairness Act — European Parliament Legislative Train Schedule](https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act)
