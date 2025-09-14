import { IXPTheme, ColorPalette } from '../types';

// Chatbox-focused color palette
const primaryPalette: ColorPalette = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9', // Main brand color
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e'
};

const secondaryPalette: ColorPalette = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a'
};

export const enhancedTheme: IXPTheme = {
  name: 'Chatbox Theme',
  version: '1.0.0',
  mode: 'light',
  colors: {
    primary: primaryPalette,
    secondary: secondaryPalette,
    background: {
      default: '#ffffff',
      paper: '#f8fafc',
      elevated: '#ffffff'
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#cbd5e1'
    },
    border: {
      default: '#e2e8f0',
      light: '#f1f5f9',
      focus: '#0ea5e9'
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  components: {
    button: {
      base: {
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontWeight: '500',
        transition: 'all 0.2s'
      },
      variants: {
        primary: {
          backgroundColor: '#0ea5e9',
          color: '#ffffff',
          border: 'none'
        },
        secondary: {
          backgroundColor: 'transparent',
          color: '#0ea5e9',
          border: '1px solid #0ea5e9'
        }
      },
      sizes: {
        md: {
          padding: '0.5rem 1rem',
          fontSize: '1rem'
        }
      },
      states: {
        hover: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)'
        },
        disabled: {
          opacity: '0.5',
          cursor: 'not-allowed'
        }
      }
    },
    card: {
      base: { backgroundColor: '#ffffff', borderRadius: '0.5rem' },
      variants: { default: {} },
      sizes: { md: {} },
      states: {}
    },
    input: {
      base: { padding: '0.5rem', borderRadius: '0.375rem' },
      variants: { default: {} },
      sizes: { md: {} },
      states: {}
    },
    modal: {
      base: { backgroundColor: '#ffffff', borderRadius: '0.5rem' },
      variants: { default: {} },
      sizes: { md: {} },
      states: {}
    }
  }
};

// Dark mode variant
export const enhancedDarkTheme: IXPTheme = {
  ...enhancedTheme,
  mode: 'dark',
  colors: {
    ...enhancedTheme.colors,
    background: {
      default: '#0f172a',
      paper: '#1e293b',
      elevated: '#334155'
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      disabled: '#64748b'
    },
    border: {
      default: '#334155',
      light: '#475569',
      focus: '#0ea5e9'
    }
  }
};

// Chatbox branding configuration
export const brandConfig = {
  logo: {
    text: 'Chatbox',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b'
    }
  },
  header: {
    title: 'Chat Assistant',
    showLogo: true
  }
};