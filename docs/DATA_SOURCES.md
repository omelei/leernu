# Databronnen — Leernu

Elke bron met licentie, URL en raadpleegdatum. Spec §3.2 en §12: geen
kaartmateriaal waarvan de licentie niet is vastgelegd.

Bijwerken doe je met `node tools/content/fetch-source.mjs`, daarna
`node tools/content/build-geo.mjs`. De ruwe bron staat in `content/geo/_source/`
en is **niet** ingecheckt; de bewerkte uitvoer in `content/geo/nl/` wél.

---

## Nederland — provinciegrenzen

| | |
|---|---|
| Bron | CBS Gebiedsindelingen 2023, geleverd via PDOK |
| Laag | `gebiedsindelingen:provincie_gegeneraliseerd` |
| Endpoint | `https://service.pdok.nl/cbs/gebiedsindelingen/2023/wfs/v1_0` |
| Licentie | **CC BY 4.0** |
| Vindplaats licentie | `AccessConstraints` in de GetCapabilities van de service zelf: `https://creativecommons.org/licenses/by/4.0/deed.nl`. Fees: `none` |
| Verplichte bronvermelding | **Bron: CBS, Kadaster** |
| Geraadpleegd | 5 september 2026 |
| Omvang | 12 features, 0,59 MB |

## Nederland — labelpunten provincies

| | |
|---|---|
| Laag | `gebiedsindelingen:provincie_labelpoint` |
| Overig | Identiek aan hierboven: zelfde service, zelfde licentie, zelfde datum |

Officiële labelpunten van CBS, gebruikt om de provincienaam op de kaart te
plaatsen. Beter dan een berekende zwaartepunt: bij een holle vorm als Zeeland
valt het zwaartepunt in het water.

---

## Waarom niet PDOK Bestuurlijke Gebieden

Dat is de voor de hand liggende bron en hij is voor dit product ongeschikt.
Vastgesteld op 5 september 2026 met punt-in-polygoon-tests op de ruwe data:

| Testpunt | Valt binnen (Bestuurlijke Gebieden) | Valt binnen (CBS) |
|---|---|---|
| IJsselmeer, midden (5,35 O — 52,75 N) | **Noord-Holland** | — (water) |
| Markermeer, midden (5,20 O — 52,52 N) | **Flevoland** | — (water) |
| Waddenzee (5,30 O — 53,35 N) | **Fryslân** | — (water) |
| Amsterdam (controle) | Noord-Holland | Noord-Holland |
| Assen (controle) | Drenthe | Drenthe |

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
