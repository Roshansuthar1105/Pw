/** Tailwind mapping for the Medhaa "Clarity" tokens.
 *  Import tokens.css once in your global stylesheet; Tailwind classes then read the same CSS variables,
 *  so light/dark switching (data-mode="dark" on <html>) works automatically.
 *  Usage: bg-surface, text-muted, border-line, bg-primary text-on-primary, rounded-card, rounded-ctl
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--pri)',
        'on-primary': 'var(--pt)',
        canvas: 'var(--bg)',
        surface: 'var(--sf)',
        'surface-2': 'var(--sf2)',
        line: 'var(--bd)',
        ink: 'var(--tx)',
        muted: 'var(--mu)',
        success: 'var(--ok)',
        warning: 'var(--wn)',
        danger: 'var(--bad)',
        review: 'var(--review)',
        sidebar: {
          DEFAULT: 'var(--sb)',
          text: 'var(--sbt)',
          muted: 'var(--sbm)',
          active: 'var(--sbac)',
          line: 'var(--sbd)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['14px', '1.5'],
        caption: ['12px', '1.4'],
        h3: ['15px', '1.3'],
        h2: ['20px', '1.25'],
        h1: ['26px', '1.2'],
        kpi: ['26px', '1.1'],
      },
      borderRadius: {
        card: '12px',
        ctl: '10px',
        item: '9px',
        dialog: '16px',
      },
      boxShadow: {
        pop: '0 12px 32px rgba(0,0,0,.14)', // floating layers only; never on cards
      },
      spacing: { sidebar: '264px', rail: '74px' },
      maxWidth: { page: '1180px' },
      transitionDuration: { DEFAULT: '200ms' },
    },
  },
  plugins: [],
};
