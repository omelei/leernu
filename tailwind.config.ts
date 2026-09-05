import type { Config } from 'tailwindcss';

// Every colour here is a CSS variable defined in src/index.css. Nothing in a
// component may reach for a literal hex value: the palette has to be changeable
// in one place, and a stray hex is invisible until someone reads the diff.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        ink: {
          900: 'var(--ink-900)',
          700: 'var(--ink-700)',
          500: 'var(--ink-500)',
        },
        line: 'var(--line)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          tint: 'var(--primary-tint)',
        },
        good: 'var(--good)',
        bad: 'var(--bad)',
        focus: 'var(--focus)',
        water: 'var(--water)',
        land: {
          DEFAULT: 'var(--land)',
          active: 'var(--land-active)',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        control: '12px',
      },
      spacing: {
        // The minimum touch target. WCAG 2.2 asks for 24px and the spec asks
        // for 44px; children on a shared school iPad get 48px.
        touch: '48px',
      },
      fontSize: {
        // One step larger than a typical adult scale throughout.
        base: ['17px', { lineHeight: '1.6' }],
        lg: ['19px', { lineHeight: '1.5' }],
        xl: ['23px', { lineHeight: '1.35' }],
        '2xl': ['28px', { lineHeight: '1.25' }],
        '3xl': ['34px', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
