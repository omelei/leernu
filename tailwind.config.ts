import type { Config } from 'tailwindcss';

// Every colour here is a CSS variable defined in src/index.css, which is the
// only file allowed to name one. A stray hex in a component is invisible in
// review and breaks the palette in exactly one place, which is the worst way
// for it to break — so a lint rule refuses them.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Replaced rather than extended, on purpose. Styleguide §D says the scale
    // is 4, 8, 12, 16, 24, 32, 48, 64, 96 and that intermediate values do not
    // exist; leaving Tailwind's default scale in place would keep p-5 and
    // gap-7 one keystroke away, and a scale you can step outside of by
    // accident is not a scale. The keys keep Tailwind's own numbering, so
    // gap-6 is still 24px and nothing has to be relearned.
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
      // 2px exists as a line thickness and as optical correction inside an
      // icon, never as distance between two elements — so it is in
      // borderWidth below and not here.
      touch: 'var(--touch)',
      'touch-min': 'var(--touch-min)',
      'touch-board': 'var(--touch-board)',
    },
    fontSize: {
      // Styleguide §C, as tokens rather than numbers: one set of classes,
      // and the values underneath change with the guise and the screen
      // width. A component says text-h1 and never has to know whether it is
      // in PO or VO, on a desktop or on a phone.
      //
      // The question is deliberately large in PO: it is read from across a
      // classroom table, not from arm's length.
      score: [
        'var(--type-score)',
        { lineHeight: 'var(--type-score-lh)', letterSpacing: 'var(--type-score-ls)' },
      ],
      h1: [
        'var(--type-h1)',
        { lineHeight: 'var(--type-h1-lh)', letterSpacing: 'var(--type-h1-ls)' },
      ],
      h2: ['var(--type-h2)', { lineHeight: 'var(--type-h2-lh)' }],
      h3: ['var(--type-h3)', { lineHeight: 'var(--type-h3-lh)' }],
      body: ['var(--type-body)', { lineHeight: 'var(--type-body-lh)' }],
      label: ['var(--type-label)', { lineHeight: 'var(--type-label-lh)' }],
      // Only VO has a step below the label; in PO this resolves to the label
      // size, so a component may use it without checking which guise it is
      // in. See --type-small in index.css.
      small: ['var(--type-small)', { lineHeight: 'var(--type-small-lh)' }],
      // The small uppercase mono eyebrow above a question. Not part of the
      // §C scale — it is a category marker, not a reading size — which is
      // why it keeps an absolute value.
      eyebrow: ['11px', { lineHeight: '16px', letterSpacing: '0.08em' }],
    },
    extend: {
      // The one width of our own. From here up the page has a rail on the
      // left, a column on the right and the destinations in the app bar; below
      // it, the modules are a menu and the destinations a tab bar (ADR-093).
      // Tailwind's own `xl` is 1280, which put a 1194 iPad Pro on its side in
      // the tablet posture only by accident of a number.
      screens: {
        desk: '1200px',
      },
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        sunken: 'var(--sunken)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          // --ink-3 is deliberately absent: at 3.75:1 on paper it is below AA
          // for text, and the only thing a colour in this file gets used for is
          // text. It stays in index.css for borders and device chrome.
        },

        // Semantics. Outside the accent system, and a module may never borrow
        // one — which is why they are named for what they mean and not for
        // what colour they are.
        good: {
          DEFAULT: 'var(--good)',
          // Two tokens with two names even though --good-text and the tafels
          // accent's text variant are the same hex today. They mean different
          // things, and a shared name is how one of them silently follows the
          // other the next time either moves. Flagged in the delivery notes.
          text: 'var(--good-text)',
        },
        bad: 'var(--bad)',
        attention: {
          // Never as text on paper: 3.02:1. The text variant is what may carry
          // words, at 5.80:1.
          DEFAULT: 'var(--attention)',
          text: 'var(--attention-text)',
        },
        neutral: 'var(--neutral)',

        // The module's accent, resolved from data-module. A component asks for
        // accent and never for topo, so a seventh or eighth module costs no
        // component change (ADR-028, ADR-029).
        accent: {
          DEFAULT: 'var(--accent)',
          text: 'var(--accent-text)',
          tint: 'var(--accent-tint)',
        },

        // The seven accents by name, for the module rail and the module
        // entrance — the two places that legitimately show every accent at
        // once and therefore cannot resolve just one.
        topo: { DEFAULT: 'var(--topo)', text: 'var(--topo-text)', tint: 'var(--topo-tint)' },
        tafels: {
          DEFAULT: 'var(--tafels)',
          text: 'var(--tafels-text)',
          tint: 'var(--tafels-tint)',
        },
        klok: { DEFAULT: 'var(--klok)', text: 'var(--klok-text)', tint: 'var(--klok-tint)' },
        woorden: {
          DEFAULT: 'var(--woorden)',
          text: 'var(--woorden-text)',
          tint: 'var(--woorden-tint)',
        },
        spelling: {
          DEFAULT: 'var(--spelling)',
          text: 'var(--spelling-text)',
          tint: 'var(--spelling-tint)',
        },
        tijdvakken: {
          DEFAULT: 'var(--tijdvakken)',
          text: 'var(--tijdvakken-text)',
          tint: 'var(--tijdvakken-tint)',
        },
        vlaggen: {
          DEFAULT: 'var(--vlaggen)',
          text: 'var(--vlaggen-text)',
          tint: 'var(--vlaggen-tint)',
        },
      },
      fontFamily: {
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        flat: 'var(--radius-flat)',
        field: 'var(--radius-field)',
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
      },
      borderWidth: {
        hair: 'var(--stroke-hair)',
        region: 'var(--stroke-region)',
        active: 'var(--stroke-active)',
        answer: 'var(--stroke-answer)',
      },
      boxShadow: {
        // Level 0 is the default and covers well over ninety percent of the
        // interface: no shadow at all, separation by a line or a surface.
        // There is no class for it because there is nothing to apply.
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
