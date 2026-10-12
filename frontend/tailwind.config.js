/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Core Canvas (translucent to reveal fixed VS Code style wallpaper) ──
        background: 'transparent',
        canvas: '#0B0C0E',

        // ── Surface Levels (Frosted Dark for optimal legibility & depth) ──
        surface: {
          DEFAULT: 'rgba(17, 19, 23, 0.82)',
          1: 'rgba(17, 19, 23, 0.78)',
          2: 'rgba(23, 26, 31, 0.85)',
          3: 'rgba(29, 33, 39, 0.90)',
          4: 'rgba(37, 42, 49, 0.95)',
          5: 'rgba(45, 50, 58, 0.97)',
          border: 'rgba(255,255,255,0.09)',
        },

        // ── Brand Accent: Muted Japanese Vermilion ────────────────────
        brand: {
          DEFAULT:  '#D45A43',
          hover:    '#E06A52',
          pressed:  '#B94734',
          soft:     'rgba(212,90,67,0.18)',
          glow:     'rgba(212,90,67,0.25)',
        },

        // ── Atmospheric Indigo (environmental depth only) ─────────────
        indigo: {
          deep: '#25263A',
          soft: 'rgba(74,76,120,0.12)',
        },

        // ── Text Scale ────────────────────────────────────────────────
        text: {
          primary:   '#F3F1EC',
          secondary: '#B9B7B2',
          muted:     '#85847F',
          disabled:  '#5D5C59',
          inverse:   '#111317',
        },

        // ── Border Scale ─────────────────────────────────────────────
        border: {
          subtle:  'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.09)',
          strong:  'rgba(255,255,255,0.14)',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display':  ['64px', { lineHeight: '1.0',  letterSpacing: '-0.035em', fontWeight: '700' }],
        'h1':       ['48px', { lineHeight: '1.05', letterSpacing: '-0.03em',  fontWeight: '700' }],
        'h2':       ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em',  fontWeight: '700' }],
        'h3':       ['22px', { lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        'body-lg':  ['18px', { lineHeight: '1.55' }],
        'body':     ['15px', { lineHeight: '1.5'  }],
        'meta':     ['13px', { lineHeight: '1.4',  fontWeight: '500' }],
        'caption':  ['12px', { lineHeight: '1.4'  }],
      },

      borderRadius: {
        'card-sm': '6px',
        'card':    '8px',
        'card-lg': '10px',
        'btn':     '8px',
        'chip':    '4px',
      },

      backgroundImage: {
        // Hero gradients
        'hero-left':   'linear-gradient(90deg, rgba(11,12,14,0.92) 0%, rgba(11,12,14,0.70) 35%, rgba(11,12,14,0.3) 65%, transparent 100%)',
        'hero-bottom': 'linear-gradient(180deg, transparent 0%, rgba(11,12,14,0.5) 50%, rgba(11,12,14,0.85) 80%, rgba(11,12,14,0.95) 100%)',
        'hero-top':    'linear-gradient(180deg, rgba(11,12,14,0.6) 0%, transparent 40%)',
        // Card hover overlay
        'card-hover':  'linear-gradient(180deg, transparent 50%, rgba(11,12,14,0.9) 100%)',
        // Indigo atmo gradient for hero atmosphere
        'atmo-indigo': 'radial-gradient(ellipse 80% 60% at 80% 40%, rgba(74,76,120,0.12) 0%, transparent 70%)',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'expo':   'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },

      animation: {
        'fade-in':    'fade-in 0.3s ease-out',
        'slide-up':   'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },

      spacing: {
        'section': '64px',
        'section-sm': '48px',
      },
    },
  },
  plugins: [],
}
