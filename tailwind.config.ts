import type { Config } from 'tailwindcss';

// Every value here is a CSS variable defined in src/design/tokens.css, which is
// the only file allowed to name a colour, a typeface, a type size or a radius.
// A stray hex in a component is invisible in review and breaks the palette in
// exactly one place, which is the worst way for it to break — so a lint rule
// refuses them, and this file never holds a value of its own.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Replaced rather than extended, on purpose: a scale you can step outside
    // of by accident is not a scale. The keys keep Tailwind's own numbering, so
    // gap-6 is still 24px. The handoff's distances are 10, 12, 16, 20, 24, 32
    // and 64 inside and between cards, 72 for a row and the tab bar, and 88 for
    // the rail (README, "Ruimte en vorm").
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      2.5: '10px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
      18: '72px',
      22: '88px',
      24: '96px',
      touch: 'var(--touch)',
      'touch-min': 'var(--touch-min)',
      'touch-tablet': 'var(--touch-tablet)',
    },
    fontSize: {
      // README, "Typografie", as tokens rather than numbers: one set of
      // classes, and the values underneath change with the screen width and,
      // later, with the guise. A component says text-display and never learns
      // whether it is on a phone.
      display: [
        'var(--type-display)',
        { lineHeight: 'var(--type-display-lh)', letterSpacing: 'var(--type-display-ls)' },
      ],
      title: [
        'var(--type-title)',
        { lineHeight: 'var(--type-title-lh)', letterSpacing: 'var(--type-title-ls)' },
      ],
      card: ['var(--type-card)', { lineHeight: 'var(--type-card-lh)' }],
      question: [
        'var(--type-question)',
        { lineHeight: 'var(--type-question-lh)', letterSpacing: 'var(--type-question-ls)' },
      ],
      number: ['var(--type-number)', { lineHeight: 'var(--type-number-lh)' }],
      'number-lg': ['var(--type-number-lg)', { lineHeight: 'var(--type-number-lg-lh)' }],
      body: ['var(--type-body)', { lineHeight: 'var(--type-body-lh)' }],
      button: ['var(--type-button)', { lineHeight: 'var(--type-button-lh)' }],
      // Always with `uppercase` and weight 600; the class `tk-label` carries
      // all three at once.
      label: [
        'var(--type-label)',
        { lineHeight: 'var(--type-label-lh)', letterSpacing: 'var(--type-label-ls)' },
      ],
      caption: ['var(--type-caption)', { lineHeight: 'var(--type-caption-lh)' }],
    },
    extend: {
      // The one width of our own. From here up the page stands beside the
      // child's own column; the navigation's own width is set in phase 5.
      screens: {
        desk: '1200px',
      },
      colors: {
        canvas: 'var(--canvas)',
        grond: 'var(--grond)',
        paper: 'var(--paper)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          text: 'var(--accent-text)',
          tint: 'var(--accent-tint)',
        },
        good: 'var(--good)',
        bad: {
          DEFAULT: 'var(--bad)',
          text: 'var(--bad-text)',
        },
        'module-tint': 'var(--module-tint)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
      },
      borderRadius: {
        chip: 'var(--radius-chip)',
        'chip-lg': 'var(--radius-chip-lg)',
        card: 'var(--radius-card)',
        'card-phone': 'var(--radius-card-phone)',
        surface: 'var(--radius-surface)',
        note: 'var(--radius-note)',
      },
      borderWidth: {
        hair: 'var(--stroke-hair)',
        region: 'var(--stroke-region)',
        active: 'var(--stroke-active)',
        focus: 'var(--stroke-focus)',
      },
    },
  },
  plugins: [],
} satisfies Config;
