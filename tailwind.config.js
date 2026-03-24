/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── New Maternal Palette ─────────────────────────────
        saffron:       '#E8863A',
        terracotta:    '#C75B39',
        cream:         '#FFF8F0',
        sage:          '#7BA68A',
        blush:         '#F2DDD0',
        charcoal:      '#2D2A26',
        muted:         '#8A8580',
        'amber-alert': '#D4932A',
        'rose-critical':'#C43B3B',
        ivory:         '#FFFCF7',
        // ── Legacy aliases (keep existing components working) ──
        primary: {
          DEFAULT: '#E8863A',
          light:   '#F5B07A',
          dark:    '#C75B39',
        },
        secondary: {
          DEFAULT: '#C75B39',
          light:   '#F2DDD0',
          dark:    '#9E3A1F',
        },
        accent: {
          DEFAULT: '#7BA68A',
          light:   '#A8C9B4',
          dark:    '#5A8A6A',
        },
        sand:               '#F2DDD0',
        'warm-gray':        '#E8DFD6',
        background:         '#FFF8F0',
        surface:            '#FFFCF7',
        'on-surface':       '#2D2A26',
        'on-surface-variant':'#8A8580',
        'risk-safe':        '#7BA68A',
        'risk-monitor':     '#D4932A',
        'risk-elevated':    '#C75B39',
        'risk-critical':    '#C43B3B',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft':    '0 2px 8px rgba(199, 91, 57, 0.06)',
        'soft-lg': '0 6px 20px rgba(199, 91, 57, 0.08)',
        'warm':    '0 4px 24px rgba(199, 91, 57, 0.10)',
        'warm-lg': '0 10px 40px rgba(199, 91, 57, 0.14)',
        'warm-xl': '0 20px 60px rgba(199, 91, 57, 0.18)',
        'glow-critical': '0 0 0 3px rgba(196, 59, 59, 0.25)',
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      animation: {
        'pulse-border': 'pulse-border 1.5s ease-in-out infinite',
        'pulse-dot':    'pulse-dot 1.2s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': { 'border-color': '#C43B3B', 'box-shadow': '0 0 0 0 rgba(196,59,59,0.4)' },
          '50%':       { 'border-color': '#ff7070', 'box-shadow': '0 0 0 6px rgba(196,59,59,0)' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1'   },
          '50%':       { transform: 'scale(1.6)', opacity: '0.5' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)'   },
          '50%':       { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
