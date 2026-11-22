/**
 * Theme colours are CSS variables (hex). Wrapping them lets opacity modifiers like `bg-muted/40`
 * or `hover:bg-sidebar-accent/60` work (mixed with transparent) instead of silently producing nothing.
 */
const tokens = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-hover',
  'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'subtle', 'accent',
  'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring', 'inverse', 'success',
  'success-bg', 'warning', 'warning-bg', 'danger', 'danger-bg', 'info', 'info-bg', 'chart-1', 'chart-2', 'chart-3',
  'chart-4', 'chart-5', 'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring'
];
const withAlpha = (name) => ({ opacityValue }) =>
  opacityValue === undefined || opacityValue === '1'
    ? `var(--${name})`
    : `color-mix(in srgb, var(--${name}) calc(${opacityValue} * 100%), transparent)`;
const colors = Object.fromEntries(tokens.map((t) => [t, withAlpha(t)]));

export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'selector',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors,
      fontFamily: {
        sans: ['Geist', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        heading: ['Geist', '"Hind Siliguri"', 'sans-serif'],
        bn: ['"Hind Siliguri"', 'Geist', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,26,44,.04), 0 1px 1px rgba(11,26,44,.03)',
        pop: '0 12px 32px -8px rgba(11,26,44,.18), 0 2px 6px rgba(11,26,44,.06)'
      }
    }
  }
}
