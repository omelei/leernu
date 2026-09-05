import type { Config } from 'tailwindcss';

// Every colour here is a CSS variable defined in src/index.css, which is the
// only file allowed to name one. A stray hex in a component is invisible in
// review and breaks the palette in exactly one place, which is the worst way
// for it to break — so a lint rule refuses them.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
        good: 'var(--good)',
        bad: 'var(--bad)',
        topo: {
          DEFAULT: 'var(--topo)',
          text: 'var(--topo-text)',
          tint: 'var(--topo-tint)',
        },
      },
      fontFamily: {
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // The design's scale. The question is deliberately large: it is read
        // from across a classroom table, not from arm's length.
        label: ['11px', { lineHeight: '16px', letterSpacing: '0.08em' }],
        base: ['17px', { lineHeight: '25px' }],
        lg: ['18px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['26px', { lineHeight: '32px' }],
        '3xl': ['38px', { lineHeight: '44px' }],
      },
      spacing: {
        // WCAG 2.2 asks 24px and the spec asks 44px; children on a shared
        // school iPad get 48.
        touch: '48px',
      },
      borderRadius: { control: '12px' },
    },
  },
  plugins: [],
} satisfies Config;
