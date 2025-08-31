import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Theme {
  name: string;
  mode: 'light' | 'dark';
  colors: {
    primary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    secondary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    background: {
      default: string;
      paper: string;
      elevated: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: {
      default: string;
      light: string;
      focus: string;
    };
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleMode: () => void;
  availableThemes: Theme[];
}

const defaultLightTheme: Theme = {
  name: 'default',
  mode: 'light',
  colors: {
    primary: {
      main: '#007bff',
      light: '#66b3ff',
      dark: '#0056b3',
      contrast: '#ffffff'
    },
    secondary: {
      main: '#6c757d',
      light: '#adb5bd',
      dark: '#495057',
      contrast: '#ffffff'
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
      elevated: '#ffffff'
    },
    text: {
      primary: '#333333',
      secondary: '#6c757d',
      disabled: '#adb5bd'
    },
    border: {
      default: '#e9ecef',
      light: '#f8f9fa',
      focus: '#007bff'
    },
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  }
};

const defaultDarkTheme: Theme = {
  name: 'dark',
  mode: 'dark',
  colors: {
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrast: '#ffffff'
    },
    secondary: {
      main: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
      contrast: '#ffffff'
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
      elevated: '#334155'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#64748b'
    },
    border: {
      default: '#334155',
      light: '#475569',
      focus: '#3b82f6'
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4'
  }
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialTheme = defaultLightTheme 
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const availableThemes = [defaultLightTheme, defaultDarkTheme];

  const toggleMode = () => {
    const newTheme = theme.mode === 'light' ? defaultDarkTheme : defaultLightTheme;
    setTheme(newTheme);
  };

  // Apply CSS custom properties when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Set color variables
    root.style.setProperty('--ixp-color-primary-main', theme.colors.primary.main);
    root.style.setProperty('--ixp-color-primary-light', theme.colors.primary.light);
    root.style.setProperty('--ixp-color-primary-dark', theme.colors.primary.dark);
    root.style.setProperty('--ixp-color-primary-contrast', theme.colors.primary.contrast);
    
    root.style.setProperty('--ixp-color-secondary-main', theme.colors.secondary.main);
    root.style.setProperty('--ixp-color-secondary-light', theme.colors.secondary.light);
    root.style.setProperty('--ixp-color-secondary-dark', theme.colors.secondary.dark);
    root.style.setProperty('--ixp-color-secondary-contrast', theme.colors.secondary.contrast);
    
    root.style.setProperty('--ixp-color-background-default', theme.colors.background.default);
    root.style.setProperty('--ixp-color-background-paper', theme.colors.background.paper);
    root.style.setProperty('--ixp-color-background-elevated', theme.colors.background.elevated);
    
    root.style.setProperty('--ixp-color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--ixp-color-text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--ixp-color-text-disabled', theme.colors.text.disabled);
    
    root.style.setProperty('--ixp-color-border-default', theme.colors.border.default);
    root.style.setProperty('--ixp-color-border-light', theme.colors.border.light);
    root.style.setProperty('--ixp-color-border-focus', theme.colors.border.focus);
    
    root.style.setProperty('--ixp-color-success', theme.colors.success);
    root.style.setProperty('--ixp-color-warning', theme.colors.warning);
    root.style.setProperty('--ixp-color-error', theme.colors.error);
    root.style.setProperty('--ixp-color-info', theme.colors.info);
    
    // Set common design tokens
    root.style.setProperty('--ixp-border-radius', '12px');
    root.style.setProperty('--ixp-spacing-xs', '0.25rem');
    root.style.setProperty('--ixp-spacing-sm', '0.5rem');
    root.style.setProperty('--ixp-spacing-md', '1rem');
    root.style.setProperty('--ixp-spacing-lg', '1.5rem');
    root.style.setProperty('--ixp-spacing-xl', '2rem');
    root.style.setProperty('--ixp-shadow-card', '0 2px 8px rgba(0, 0, 0, 0.1)');
    
    // Update body background
    document.body.style.backgroundColor = theme.colors.background.default;
    document.body.style.color = theme.colors.text.primary;
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleMode,
    availableThemes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;