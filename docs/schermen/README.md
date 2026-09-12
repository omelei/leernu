# Schermen, één voor één

Eén bestand per scherm, zodat elk scherm apart kan worden bijgesteld en
gebouwd. De vorige poging (huisstijl v2, PR #31) veranderde alles tegelijk en
is teruggedraaid; deze map is de kleinere weg terug.

## Werkwijze

1. Open het bestand van één scherm in een browser. Links staat het ontwerp uit
   de overdracht, ernaast wat er nu live staat, eronder de open keuzes.
2. Kies per keuze, of schrijf erbij wat anders moet.
3. Pas als het bestand klopt, wordt dat ene scherm gebouwd, in een eigen PR.

De bron voor "ontwerp" is de overdracht in `topo-prive/Leveringsvorm en
huisstijl v2/design_handoff_leernu/` (Stap 2 op 1366 en 393, Stap 3 voor de
tabletmaten). De bron voor "nu live" is `main`.

## Overzicht

| Nr  | Scherm                              | Bestand                        | Stand     |
| --- | ----------------------------------- | ------------------------------ | --------- |
| 00  | Kader: kopbalk, logo, rail, tabbalk | [00-kader.html](00-kader.html) | klaar     |
| S1  | Startscherm                         | `s01-startscherm.html`         | nog maken |
| S2  | Voordeur (Vandaag)                  | `s02-voordeur.html`            | nog maken |
| S3  | Vakmenu                             | `s03-vakmenu.html`             | nog maken |
| S4  | Modulepagina (Kies je ronde)        | `s04-modulepagina.html`        | nog maken |
| S5  | Oefenscherm: aanwijzen, vraag       | `s05-aanwijzen.html`           | nog maken |
| S6  | Oefenscherm: goed                   | `s06-goed.html`                | nog maken |
| S7  | Oefenscherm: fout, bijna, gemist    | `s07-fout.html`                | nog maken |
| S8  | Oefenscherm: meerkeuze              | `s08-meerkeuze.html`           | nog maken |
| S9  | Oefenscherm: typen                  | `s09-typen.html`               | nog maken |
| S10 | Uitslag (Ronde klaar)               | `s10-uitslag.html`             | nog maken |
| S11 | Verzameling                         | `s11-verzameling.html`         | nog maken |
| S12 | Jij                                 | `s12-jij.html`                 | nog maken |

Het kader komt eerst omdat elk scherm met navigatie erin staat. S1 en S10
hebben geen kopbalk, en S5 tot en met S9 zijn de ronde, die geen navigatie
heeft.
