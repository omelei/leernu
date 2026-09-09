# Databronnen — Leernu

Elke bron met licentie, URL en raadpleegdatum. Spec §3.2 en §12: geen
kaartmateriaal waarvan de licentie niet is vastgelegd.

Bijwerken doe je met `node tools/content/fetch-source.mjs`, daarna
`node tools/content/build-geo.mjs`. Allebei draaien zonder npm (ADR-018).

De ruwe bron staat in `content/geo/_source/` en is **niet** ingecheckt. De
bewerkte uitvoer staat in **`public/geo/nl/`** en wél — daar staat hij omdat de
app hem tijdens het gebruik ophaalt in plaats van meebundelt: geodata is een orde
van grootte groter dan de rest van het product, en spec §8 begrenst de app-shell
op 300 kB.

Kijken naar het resultaat kan zonder npm:

```
python -m http.server 8942
```

Daarna `http://localhost:8942/tools/content/preview.html`.

---

## Nederland — provinciegrenzen

|                           |                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Bron                      | CBS Gebiedsindelingen 2023, geleverd via PDOK                                                                                      |
| Laag                      | `gebiedsindelingen:provincie_gegeneraliseerd`                                                                                      |
| Endpoint                  | `https://service.pdok.nl/cbs/gebiedsindelingen/2023/wfs/v1_0`                                                                      |
| Licentie                  | **CC BY 4.0**                                                                                                                      |
| Vindplaats licentie       | `AccessConstraints` in de GetCapabilities van de service zelf: `https://creativecommons.org/licenses/by/4.0/deed.nl`. Fees: `none` |
| Verplichte bronvermelding | **Bron: CBS, Kadaster**                                                                                                            |
| Geraadpleegd              | 5 september 2026                                                                                                                   |
| Omvang                    | 12 features, 0,59 MB                                                                                                               |

## Nederland — labelpunten provincies

|        |                                                                       |
| ------ | --------------------------------------------------------------------- |
| Laag   | `gebiedsindelingen:provincie_labelpoint`                              |
| Overig | Identiek aan hierboven: zelfde service, zelfde licentie, zelfde datum |

Officiële labelpunten van CBS, gebruikt om de provincienaam op de kaart te
plaatsen. Beter dan een berekende zwaartepunt: bij een holle vorm als Zeeland
valt het zwaartepunt in het water.

## Nederland — gemeentegrenzen (voor de Waddeneilanden)

|        |                                                 |
| ------ | ----------------------------------------------- |
| Laag   | `gebiedsindelingen:gemeente_gegeneraliseerd`    |
| Overig | Zelfde service, licentie en datum als hierboven |

Elk Waddeneiland is een eigen gemeente, dus de gemeentelaag levert hun
omtrekken uit dezelfde geverifieerde bron. Ze worden door dezelfde projectie
gehaald als de provincies, zodat een eiland op zijn eigen kust ligt in plaats
van er een paar eenheden naast.

## Nederland — labelpunten gemeenten (voor de steden)

|        |                                                 |
| ------ | ----------------------------------------------- |
| Laag   | `gebiedsindelingen:gemeente_labelpoint`         |
| Overig | Zelfde service, licentie en datum als hierboven |

Eén punt per gemeente, door CBS geplaatst waar het label hoort te staan — in de
praktijk in de kern, niet op het zwaartepunt van het grondgebied. Dat is precies
wat een stadspunt moet zijn.

CBS levert **twee** punten voor Amsterdam. Dat is geen fout in de bron: de
gemeente is niet aaneengesloten, Zuidoost ligt los van de rest achter
Ouder-Amstel, en elk deel krijgt een eigen label. `build-steden.mjs`
dedupliceert op `statcode` en houdt het punt dat binnen het grootste deel van de
gemeente valt, zodat de keuze niet afhangt van de volgorde in het bestand.

## Nederland — inwonertal per gemeente

|           |                                                                  |
| --------- | ---------------------------------------------------------------- |
| Bron      | CBS StatLine, tabel `70072ned` (Regionale kerncijfers Nederland) |
| Veld      | `TotaleBevolking_1`, per `RegioS` (gemeentecode)                 |
| Licentie  | CC BY 4.0                                                        |
| URL       | https://opendata.cbs.nl/ODataApi/odata/70072ned                  |
| Opgehaald | 2026-09-06                                                       |

Bepaalt welke tachtig steden in de set komen en in welke laag: 25 basis, 30
gevorderd, 25 expert, aflopend op inwonertal. Dat is een reproduceerbare
rangschikking uit een genoemde bron in plaats van een lijst die iemand
opgeschreven heeft.

Eén ding is wél redactioneel, en dat staat bewust op één plek: `GEEN_STAD` in
`tools/content/build-steden.mjs`. CBS publiceert gemeenten, en er is geen
gelicentieerde bron die zegt welke gemeenten ook plaatsen zijn. "Utrechtse
Heuvelrug" en "Oude IJsselstreek" zijn streken, geen steden — die keuze moet
iemand maken, en die staat daar met de regel erbij (de naam blijft als een
plaats zo heet; hij vervalt als alleen de gemeente zo heet).

De provincie waarin een stad ligt wordt niet overgeschreven maar berekend: het
labelpunt wordt tegen de CBS-provinciegeometrie gelegd. Valt een stad in geen
enkele provincie, dan faalt de build.

## Nederland — zeeën en meren

|              |                                                                                      |
| ------------ | ------------------------------------------------------------------------------------ |
| Bron         | Punten gekozen, **geverifieerd** tegen CBS Gebiedsindelingen 2023                    |
| Licentie     | De geometrie die de controle uitvoert is CC BY 4.0; de punten zelf zijn geen dataset |
| Geraadpleegd | 6 september 2026                                                                     |

Voor het IJsselmeer, de Waddenzee, het Markermeer, de Ooster- en Westerschelde
en de Noordzee is geen bruikbare polygoonbron gevonden. PDOK's waterlagen
beschrijven scheepvaartroutes in plaats van aardrijkskunde, en het IJsselmeer
afleiden uit het gat tussen drie provincies vraagt booleaanse geometrie.

Daarom zijn het **punten met een ruim trefvlak**, en is de coördinaat gekozen in
plaats van overgenomen. Dat zou normaal precies zijn wat spec §12 verbiedt, dus
de build controleert ze: CBS-provincies bevatten geen water (ADR-019), dus elk
waterpunt moet buiten alle twaalf provincies vallen. Een coördinaat die op land
belandt laat `tools/content/build-waters.mjs` falen in plaats van een klaslokaal
te bereiken. Die controle is het licentie-equivalent — de geometrie die
controleert is wél gelicentieerd.

**Rivieren staan hier niet in.** Een rivier is een lijn, en een punt op de Maas
zegt niets over een waterweg die het halve land doorkruist. Ze hebben een eigen
bron en een eigen antwoordvorm nodig; Natural Earth is de kandidaat, maar de
detaillering op Nederlandse schaal is nog niet gemeten.

---

## Waarom niet PDOK Bestuurlijke Gebieden

Dat is de voor de hand liggende bron en hij is voor dit product ongeschikt.
Vastgesteld op 5 september 2026 met punt-in-polygoon-tests op de ruwe data:

| Testpunt                              | Valt binnen (Bestuurlijke Gebieden) | Valt binnen (CBS) |
| ------------------------------------- | ----------------------------------- | ----------------- |
| IJsselmeer, midden (5,35 O — 52,75 N) | **Noord-Holland**                   | — (water)         |
| Markermeer, midden (5,20 O — 52,52 N) | **Flevoland**                       | — (water)         |
| Waddenzee (5,30 O — 53,35 N)          | **Fryslân**                         | — (water)         |
| Amsterdam (controle)                  | Noord-Holland                       | Noord-Holland     |
| Assen (controle)                      | Drenthe                             | Drenthe           |

`provinciegebied` bevat het water dat bestuurlijk aan een provincie is
toegewezen. Dat levert twee fouten op, en de tweede is de ernstige:

1. De kaart tekent het IJsselmeer als land.
2. In "wijs Noord-Holland aan" telt een klik **midden op het IJsselmeer** als
   goed. Dat is dezelfde soort fout als het accepteren van Epe voor Ede
   (ADR-017): het systeem beloont een antwoord dat aardrijkskundig onjuist is.
   Het IJsselmeer is bovendien zelf een leeritem uit spec §3.1.

CBS levert grenzen zonder water, en is al gegeneraliseerd — 0,59 MB in plaats
van 5,22 MB.

Bestuurlijke Gebieden blijft bruikbaar voor iets anders: als er ooit een
oefening komt over bestuurlijke indeling in plaats van aardrijkskunde, is
"welke provincie beheert dit stuk water" precies wat die dataset beantwoordt.

---

## Natural Earth — landen van Europa en van de wereld

|                   |                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bron**          | Natural Earth, `ne_50m_admin_0_countries` en `ne_110m_admin_0_countries`                                                                                               |
| **Vindplaats**    | https://github.com/nvkelso/natural-earth-vector — `geojson/`                                                                                                           |
| **Licentie**      | Publiek domein. Natural Earth stelt zelf: geen toestemming nodig, geen bronvermelding verplicht, geen beperkingen.                                                     |
| **Opgehaald**     | 9 september 2026                                                                                                                                                       |
| **Gebruikt voor** | `public/geo/<regio>/landen.*.json` en `content/sets/<regio>-landen.json`, voor zeven regio&#39;s: europa, afrika, azie, noord-amerika, zuid-amerika, oceanie en wereld |
| **Gebouwd door**  | `tools/content/build-countries.mjs`                                                                                                                                    |

Bronvermelding is niet verplicht en staat er toch, hier en in de kaartbestanden
zelf: een kaart zonder herkomst is een kaart die niemand kan controleren.

**Twee schalen.** 1:50m voor de zes werelddelen, want op 1:110m ontbreken Luxemburg,
Montenegro, Kosovo en de helft van de Balkan gewoon in het bestand — en een set
"landen van Europa" die er elf stilzwijgend weglaat is slechter dan geen set.
1:110m voor de wereld, waar 1:50m vier megabyte kustlijn zou zijn die op die
schaal niemand ziet.

**Welke features een land zijn.** Het admin-0-bestand bevat soevereine staten,
afhankelijke gebieden, kroondomeinen en betwiste gebieden door elkaar, en juist
daar wordt een kaart voor kinderen ongemerkt een politiek statement. De regel is
die van de bron zelf, twee keer: een feature is hier een land als het zijn eigen
soeverein is (`ADMIN` gelijk aan `SOVEREIGNT`) én een ISO 3166-code heeft. Het
eerste houdt Nederland, Frankrijk en Kosovo binnen en laat Jersey, de Faeröer en
Puerto Rico buiten; het tweede laat Noord-Cyprus en Somaliland buiten, die
zichzelf besturen en waaraan de normcommissie geen code heeft toegekend. Dat is
een vraag die dit product niet beslecht.

**Welk werelddeel.** Het eigen `CONTINENT`-veld van Natural Earth, met één
uitzondering: Cyprus staat daar onder Azië en elke Nederlandse atlas drukt het
óók op de Europa-pagina af, dus het staat in beide lijsten — met eigen ids, zodat
het één keer goed beantwoorden niet meetelt voor de andere kaart. Rusland staat
bij Europa, waar de bron en de atlas het allebei zetten. Zie ADR-086 en ADR-087.

Elk werelddeel heeft een eigen venster in graden waar de kaart ophoudt — wat een
atlaspagina ook doet — en een eigen projectiecentrum. Ze staan in
`tools/content/build-countries.mjs`, elk met de reden erbij.

**De namen komen uit de data** (`NAME_NL`), niet van ons. Twee zijn gecorrigeerd
omdat het land zichzelf hernoemd heeft en de bron dat nog niet volgt — Eswatini
(2018) en Belarus — en beide houden de oude naam als alias.

---

## Nog niet in gebruik

Voorbereid maar nog niet opgehaald; licentie vooraf te verifiëren zoals
hierboven, dus met de bron zelf als vindplaats en niet met een blogpost.

- **Natural Earth** — steden, rivieren en gebergtes voor Europa en wereld. De
  landgrenzen zijn er wel (zie hierboven); de rest nog niet.
- **PDOK BRT / waterdelen** — voor wateren als leeritem (IJsselmeer, Waddenzee,
  de rivieren) in plaats van alleen als achtergrond.

**OpenStreetMap wordt niet gebruikt.** ODbL is besmettelijk voor afgeleide
databases en dit is een commercieel product; spec §3.2 wijst dat om die reden
al af.
