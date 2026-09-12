# Huisstijl

De huisstijl van leer.nu komt uit de overdracht `design_handoff_leernu` (in
`topo-prive`, README onder "Ontwerptokens"). De waarden daarin zijn definitief.
Dit blad zegt hoe je een scherm bouwt dat erbij hoort; ADR-106 zegt waarom het
zo staat.

## Waar de waarden staan

- **`src/index.css`** is de enige plek die een kleur, lettertype of maat van de
  huisstijl noemt. Bovenaan staat `:root` met de tokentabel van de overdracht,
  daaronder de telefoon, VO en het blok `[data-thema='ronde']`.
- **`tailwind.config.ts`** vertaalt de tokens naar klassen. Kleuren, fonts,
  radii, schaduwen en de typeschaal _vervangen_ Tailwinds eigen waarden:
  `bg-blue-500`, `rounded-lg`, `shadow-md` en `font-serif` bestaan hier niet.

## Een nieuw scherm

1. **Kleur op rol, niet op waarde.** `bg-papier` voor de grond van een scherm,
   `bg-kaart` voor een kaart of paneel, `text-inkt`, `text-tekst-secundair`,
   `text-tekst-tertiair`, `border-rand-licht` voor een kaart en
   `border-rand-bediening` voor de rand van iets dat je kunt indrukken.
2. **Typografie op rol.** `text-paginakop`, `text-sectiekop`, `text-kaartkop`,
   `text-vraag`, `text-getal` en `text-getal-groot` in Archivo (een `h1`–`h3`
   krijgt dat vanzelf, anders `tk-display`); `text-lopend`, `text-knop`,
   `text-bijschrift` en `text-vlaklabel` in Public Sans. Het gewicht hoort bij
   de rol: zet er geen `font-semibold` of `font-bold` naast.
3. **Vorm.** `rounded-kaart` (12) voor kaarten, knoppen en velden,
   `rounded-chip` (6) voor een chip, optie of plaat, `rounded-pil` voor een pil.
   Randen zijn 1 px (`border-hair`), 2 px (`border-active`) alleen bij nadruk of
   een gekozen staat. Geen schaduw, behalve `drop-shadow-beloning` op een
   beloningsafbeelding.
4. **Trefmaten.** Een knop is `h-knop` (56 in PO, 44 in VO). Het kleinste dat
   iets indrukbaars mag zijn is `raak`: 44 onder een muis, 48 op een tablet, 56
   onder een duim en altijd 56 in een ronde. Nooit een vaste maat eronder.
5. **Een ronde is donker.** Zet `data-thema="ronde"` op de wortel van een
   scherm waarin een kind antwoordt. Dezelfde rolnamen krijgen daar de donkere
   waarden, dus een component hoeft er niets voor te weten. De uitslag staat
   buiten de ronde en is licht.
6. **Goed, fout, gemist.** Kleur voegt snelheid toe, vorm draagt de betekenis:
   - goed is een dicht vlak met een vinkje,
   - fout is een gearceerd vlak (45°, periode 8 px) met een kruis,
   - gemist is een open vlak met een dubbele rand en een punt.

   Na een antwoord staat `UitkomstTeken` naast de terugkoppeling; op de kaart
   doen `.tk-shape-correct`, `.tk-shape-wrong` en `.tk-shape-missed-outer` het.
   Nooit kleur als enige drager.

## Wat het bewaakt

- `src/design/huisstijl.test.ts` houdt elke tokenwaarde aan de overdracht, en
  faalt op een losse hex in een regel, een schaduw, een derde lettertype, een
  oude tokennaam of een Tailwind-klasse buiten de tokens.
- `src/design/contrast.test.ts` meet de kleurparen, licht en in een ronde.
- `src/design/answerStates.test.ts` houdt de vormregels vast.
- `e2e/huisstijl.spec.ts` kijkt in de draaiende app: de grond, Archivo in de
  koppen, en een donkere ronde met knoppen van 56.
- ESLint weigert een hexwaarde in TypeScript.
