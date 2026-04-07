/** @type {import('tailwindcss').Config} */

// ── Design tokens ────────────────────────────────────────────────────────────
// One rule governs colour here: chroma is a clinical signal.
//
//   warm  = the patient's state   (the risk ramp — safe / watch / high / critical)
//   cool  = something you can act on (links, buttons, focus)
//   ink   = everything else       (text, rules, structure)
//
// Nothing decorative is coloured. An alarm that competes with ornament stops
// reading as an alarm, which is the argument the paper behind this repo makes.
// Every pairing below clears WCAG AA (4.5:1) on both paper and white.
const ink = {
  DEFAULT: '#191A17',   // near-black, warmed to sit on paper without going blue
  soft:    '#5C5E58',   // secondary text — 6.0:1 on paper
  rule:    '#E4E2DB',   // hairlines
  strong:  '#C9C6BC',   // emphasised hairlines, disabled fills
};

const risk = {
  safe:     '#276749',
  watch:    '#8A5D0B',
  high:     '#AE4515',
  critical: '#8F1D1D',
};

const riskTint = {
  safe:     '#E7EFEA',
  watch:    '#F5EDDC',
  high:     '#F7E9E2',
  critical: '#F5E4E4',
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F5F2',
        card:  '#FFFFFF',
        ink,
        action: { DEFAULT: '#1E3A5F', hover: '#162C48', tint: '#E8ECF2' },
        risk,
        'risk-tint': riskTint,

        // ── Aliases ────────────────────────────────────────────────────────
        // The two dashboards carry ~800 colour classes written against the old
        // palette. Repointing the names here restyles them coherently without
        // editing three thousand lines of JSX by hand.
        cream:           '#F6F5F2',
        ivory:           '#FFFFFF',
        charcoal:        ink.DEFAULT,
        muted:           ink.soft,
        blush:           ink.rule,
        'warm-gray':     ink.strong,
        sand:            '#EFEDE7',
        saffron:         '#1E3A5F',   // the action colour — cool, never a signal
        sage:            risk.safe,
        'amber-alert':   risk.watch,
        terracotta:      risk.high,
        'rose-critical': risk.critical,
        background:      '#F6F5F2',
        surface:         '#FFFFFF',
        'on-surface':            ink.DEFAULT,
        'on-surface-variant':    ink.soft,
        'risk-safe':     risk.safe,
        'risk-monitor':  risk.watch,
        'risk-elevated': risk.high,
        'risk-critical': risk.critical,
        primary:   { DEFAULT: '#1E3A5F', light: '#3A5A82', dark: '#162C48' },
        secondary: { DEFAULT: ink.DEFAULT, light: ink.soft, dark: '#000000' },
        accent:    { DEFAULT: risk.safe, light: riskTint.safe, dark: '#1C4F37' },
      },

      fontFamily: {
        // IBM Plex Sans has no Devanagari, so Devanagari text falls through to
        // IBM Plex Sans Devanagari on its own — same superfamily, matched
        // optically, no per-string language class anywhere in the app.
        sans:    ['"IBM Plex Sans"', '"IBM Plex Sans Devanagari"', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Sans"', '"IBM Plex Sans Devanagari"', 'system-ui', 'sans-serif'],
        body:    ['"IBM Plex Sans"', '"IBM Plex Sans Devanagari"', 'system-ui', 'sans-serif'],
        // Clinical numbers only: BP, haemoglobin, weeks, scores, ids.
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        serif:   ['"IBM Plex Sans"', '"IBM Plex Sans Devanagari"', 'system-ui', 'sans-serif'],
      },

      // Documents have corners. Blobs are for marketing sites.
      borderRadius: {
        xl:  '0.5rem',
        '2xl': '0.625rem',
        '3xl': '0.75rem',
        '4xl': '0.875rem',
      },

      boxShadow: {
        soft:     '0 1px 2px rgba(25, 26, 23, 0.05)',
        'soft-lg':'0 2px 6px rgba(25, 26, 23, 0.06)',
        warm:     '0 1px 2px rgba(25, 26, 23, 0.05)',
        'warm-lg':'0 4px 14px rgba(25, 26, 23, 0.08)',
        'warm-xl':'0 10px 30px rgba(25, 26, 23, 0.10)',
        'glow-critical': '0 0 0 3px rgba(143, 29, 29, 0.18)',
        lift:     '0 6px 20px rgba(25, 26, 23, 0.09)',
      },

      letterSpacing: { label: '0.08em' },

      animation: {
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
        'pulse-dot':    'pulse-dot 1.8s ease-in-out infinite',
        float:          'none',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(143, 29, 29, 0.28)' },
          '50%':      { 'box-shadow': '0 0 0 5px rgba(143, 29, 29, 0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.35' },
        },
      },
    },
  },
  plugins: [],
}
