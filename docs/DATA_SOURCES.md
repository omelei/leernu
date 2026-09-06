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

## Nederland — zeeën en meren

| | |
|---|---|
| Bron | Punten gekozen, **geverifieerd** tegen CBS Gebiedsindelingen 2023 |
| Licentie | De geometrie die de controle uitvoert is CC BY 4.0; de punten zelf zijn geen dataset |
| Geraadpleegd | 6 september 2026 |

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

## Nog niet in gebruik

Voorbereid maar nog niet opgehaald; licentie vooraf te verifiëren zoals
hierboven, dus met de bron zelf als vindplaats en niet met een blogpost.

- **Natural Earth** — landgrenzen, steden, rivieren, gebergtes voor Europa en
  wereld (fase 5). Publiek domein. Bereikbaarheid bevestigd op 5 september 2026.
- **PDOK BRT / waterdelen** — voor wateren als leeritem (IJsselmeer, Waddenzee,
  de rivieren) in plaats van alleen als achtergrond.

**OpenStreetMap wordt niet gebruikt.** ODbL is besmettelijk voor afgeleide
databases en dit is een commercieel product; spec §3.2 wijst dat om die reden
al af.
