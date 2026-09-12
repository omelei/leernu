import type { Config } from 'tailwindcss';

// Every value here is a CSS variable from src/index.css, the only file that may
// name a colour, a typeface or a size of the house style (docs/HUISSTIJL.md).
//
// Colours, families, radii, shadows and the type scale *replace* Tailwind's
// defaults rather than extend them. A class like bg-blue-500, rounded-lg,
// shadow-md or font-serif does not exist in this project, so a new page cannot
// step outside the house style by accident: the class simply renders nothing.
// src/design/huisstijl.test.ts says so out loud, with the name of the file.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Replaced rather than extended, on purpose: the scale is 4, 8, 12, 16,
    // 24, 32, 48, 64, 96 and intermediate values do not exist. The keys keep
    // Tailwind's own numbering, so gap-6 is still 24px.
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
      24: '96px',
      // The height of a button, 56 in PO and 44 in VO, and 56 in a round
      // whatever the guise.
      knop: 'var(--knop-hoogte)',
      // The smallest a control may be where it stands: 44 under a pointer,
      // 48 on a tablet, 56 under a thumb and in a round.
      raak: 'var(--raak)',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',

      // The handoff's palette, by role. In a round the same names hold the
      // dark values ([data-thema='ronde'] in index.css), so a component says
      // bg-kaart and is right in both.
      canvas: 'var(--canvas)',
      papier: 'var(--papier)',
      kaart: 'var(--kaart)',
      inkt: 'var(--inkt)',
      tekst: {
        secundair: 'var(--tekst-secundair)',
        tertiair: 'var(--tekst-tertiair)',
      },
      rand: {
        licht: 'var(--rand-licht)',
        sterk: 'var(--rand-sterk)',
        bediening: 'var(--rand-bediening)',
      },
      nadruk: {
        DEFAULT: 'var(--nadruk)',
        vlak: 'var(--nadruk-vlak)',
        tekst: 'var(--nadruk-tekst)',
      },
      // Wrong is a hatched area and a cross; this is the colour that goes with
      // the shape, never the shape itself.
      fout: {
        DEFAULT: 'var(--fout)',
        vlak: 'var(--fout-vlak)',
        tekst: 'var(--fout-tekst)',
      },
      // What is chosen, done or being asked about: the handoff's green, by the
      // name the accent rule (accent.test.ts) guards.
      accent: {
        DEFAULT: 'var(--accent)',
        text: 'var(--accent-text)',
        tint: 'var(--accent-tint)',
      },
    },
    fontFamily: {
      // Archivo 600 and 700: headings, numbers, the labels of cards.
      kop: 'var(--font-kop)',
      // Public Sans 400 and 600: running text, buttons, tables.
      tekst: 'var(--font-tekst)',
    },
    // The handoff's type scale. The weight belongs to the role, so it travels
    // with the size; the family does not fit in a font size, and headings get
    // theirs from the h1-h3 rule or .tk-display. The values underneath change
    // with the screen and the guise, so a component says text-paginakop and
    // never has to know which it is on.
    fontSize: {
      paginakop: [
        'var(--type-paginakop)',
        {
          lineHeight: 'var(--type-paginakop-lh)',
          letterSpacing: 'var(--type-paginakop-ls)',
          fontWeight: 'var(--type-paginakop-weight)',
        },
      ],
      sectiekop: [
        'var(--type-sectiekop)',
        {
          lineHeight: 'var(--type-sectiekop-lh)',
          letterSpacing: 'var(--type-sectiekop-ls)',
          fontWeight: 'var(--type-sectiekop-weight)',
        },
      ],
      kaartkop: [
        'var(--type-kaartkop)',
        { lineHeight: 'var(--type-kaartkop-lh)', fontWeight: 'var(--type-kaartkop-weight)' },
      ],
      vraag: [
        'var(--type-vraag)',
        {
          lineHeight: 'var(--type-vraag-lh)',
          letterSpacing: 'var(--type-vraag-ls)',
          fontWeight: 'var(--type-vraag-weight)',
        },
      ],
      getal: [
        'var(--type-getal)',
        { lineHeight: 'var(--type-getal-lh)', fontWeight: 'var(--type-getal-weight)' },
      ],
      'getal-groot': [
        'var(--type-getal-groot)',
        { lineHeight: 'var(--type-getal-groot-lh)', fontWeight: 'var(--type-getal-groot-weight)' },
      ],
      lopend: ['var(--type-lopend)', { lineHeight: 'var(--type-lopend-lh)' }],
      knop: ['var(--type-knop)', { lineHeight: 'var(--type-knop-lh)' }],
      vlaklabel: [
        'var(--type-vlaklabel)',
        {
          lineHeight: 'var(--type-vlaklabel-lh)',
          letterSpacing: 'var(--type-vlaklabel-ls)',
          fontWeight: 'var(--type-vlaklabel-weight)',
        },
      ],
      bijschrift: ['var(--type-bijschrift)', { lineHeight: 'var(--type-bijschrift-lh)' }],
    },
    borderRadius: {
      none: '0px',
      chip: 'var(--radius-chip)',
      'chip-groot': 'var(--radius-chip-groot)',
      'kaart-vo': 'var(--radius-kaart-vo)',
      kaart: 'var(--radius-kaart)',
      'kaart-telefoon': 'var(--radius-kaart-telefoon)',
      rondevlak: 'var(--radius-rondevlak)',
      // A pill and the dot, which are round whatever their size.
      pil: 'var(--radius-pil)',
    },
    // No shadow at all, anywhere, except on a reward image — and that one is a
    // filter, below, because it follows the drawing and not its box.
    boxShadow: {
      none: 'none',
    },
    dropShadow: {
      beloning: 'var(--schaduw-beloning)',
    },
    extend: {
      // The one width of our own. From here up the page has a rail on the
      // left, a column on the right and the destinations in the app bar; below
      // it, the modules are a menu and the destinations a tab bar (ADR-093).
      screens: {
        desk: '1200px',
      },
      // A bare `border` draws the light rule, not currentColor.
      borderColor: {
        DEFAULT: 'var(--rand-licht)',
      },
      borderWidth: {
        hair: 'var(--stroke-hair)',
        active: 'var(--stroke-active)',
      },
    },
  },
  plugins: [],
} satisfies Config;
