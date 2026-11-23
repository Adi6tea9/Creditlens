import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

/**
 * CreditLens design tokens — Frontend Master Spec v1.1, sections 4.1–4.5.
 * Semantic names are used in components; the hex values below are extracted
 * from docs/ui/creditlens_credit_risk_research_demo.html.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Spec 4.5: Tailwind's breakpoints, stated explicitly.
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Spec 4.1 — surfaces and text.
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0', // cards 90%, header 80%; table dividers use slate-100
        ink: '#0F172A',
        body: '#334155',
        muted: '#475569',
        subtle: '#64748B',

        // Primary (teal).
        primary: '#0D9488',
        'primary-hover': '#0F766E',
        'primary-text': '#0F766E', // hover teal-800 #115E59
        'primary-tint': '#F0FDFA',
        'primary-border': '#99F6E4',

        // Caution (amber) — fills, dots and outlines only; never text on white.
        // Keep the full prototype shade scale; DEFAULT is the spec token.
        amber: { ...colors.amber, DEFAULT: '#D97706' },
        'amber-bar': '#FCD34D',
        'amber-text': '#B45309',
        'amber-ink': '#92400E',
        'warn-bg': '#FFFBEB', // 75–85% in use
        'warn-border': '#FDE68A',

        // Reject (rose).
        reject: '#E11D48',
        'reject-text': '#BE123C', // pills/KPI labels use rose-800 #9F1239
        'reject-tint': '#FFF1F2',
        'reject-border': '#FECDD3',

        // Informational (sky).
        'info-bg': '#F0F9FF', // 90% in use
        'info-border': '#BAE6FD',
        'info-dot': '#0EA5E9',

        // Result risk bar (segments 25 / 25 / 50 on a 0–40 scale).
        'riskbar-lower': '#2DD4BF', // 80% in use
        'riskbar-moderate': '#FCD34D',
        'riskbar-higher': '#FB7185', // 85% in use

        // Tables, controls and validation.
        thead: '#F8FAFC', // 90% in use
        'input-border': '#64748B',
        error: '#B91C1C',

        // Logo tile gradient (spec 4.4).
        'logo-from': '#14B8A6',
        'logo-via': '#0D9488',
        'logo-to': '#3730A3',
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // Spec 4.3 — shape and spacing.
      borderRadius: {
        card: '1rem', // rounded-2xl
        panel: '0.75rem', // rounded-xl: banners, KPI tiles, upload, tables
        control: '0.75rem', // inputs, selects, buttons
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15,23,42,.04), 0 1px 2px -1px rgba(15,23,42,.03)',
        'card-hover': '0 10px 25px -5px rgba(15,23,42,.06), 0 4px 10px -4px rgba(15,23,42,.04)',
      },
      spacing: {
        touch: '2.75rem', // 44px minimum touch target
        'slider-thumb': '1.125rem', // 18px slider thumb
      },
      minHeight: {
        touch: '2.75rem',
        control: '2.75rem',
      },
      maxWidth: {
        shell: '72rem', // max-w-6xl (1152px)
      },

      // Spec 3 — content panels: opacity 0→1, translateY 4px→0, 0.22s ease-out.
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeSlideIn: 'fadeSlideIn 0.22s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
