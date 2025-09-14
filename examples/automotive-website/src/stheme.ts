// Local theme configuration for automotive website example

export interface ThemeColors {
  primary: Record<number, string>;
  secondary: Record<number, string>;
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  border: {
    default: string;
  };
}

export interface ThemeTypography {
  fontSize: {
    sm: string;
    base: string;
    lg: string;
    xl: string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    bold: string;
  };
  lineHeight: {
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  [key: number]: string;
}

export interface ComponentTheme {
  base: Record<string, any>;
  variants: Record<string, Record<string, any>>;
  sizes: Record<string, Record<string, any>>;
  states: Record<string, Record<string, any>>;
}

export interface LocalTheme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  components: {
    card: ComponentTheme;
    button: ComponentTheme;
  };
}

// Enhanced theme configuration
export const localTheme: LocalTheme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    secondary: {
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
    },
    background: {
      default: '#ffffff',
      paper: '#f8fafc'
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b'
    },
    border: {
      default: '#e2e8f0'
    }
  },
  typography: {
    fontSize: {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      bold: '700'
    },
    lineHeight: {
      normal: 1.5,
      relaxed: 1.6
    }
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px'
  },
  components: {
    card: {
      base: {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px'
      },
      variants: {
        elevated: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        outlined: {
          border: '2px solid #e2e8f0'
        },
        default: {}
      },
      sizes: {
        sm: {
          padding: '12px'
        },
        md: {
          padding: '16px'
        },
        lg: {
          padding: '24px'
        }
      },
      states: {
        hover: {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
        }
      }
    },
    button: {
      base: {
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      variants: {
        primary: {
          backgroundColor: '#2563eb',
          color: '#ffffff'
        },
        secondary: {
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: '1px solid #e2e8f0'
        }
      },
      sizes: {
        sm: {
          padding: '6px 12px',
          fontSize: '14px'
        },
        md: {
          padding: '8px 16px',
          fontSize: '14px'
        },
        lg: {
          padding: '12px 24px',
          fontSize: '16px'
        }
      },
      states: {
        hover: {
          backgroundColor: '#1d4ed8'
        },
        active: {
          backgroundColor: '#1e40af'
        }
      }
    }
  }
};

export default localTheme;