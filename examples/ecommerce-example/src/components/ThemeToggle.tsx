import React from 'react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleMode } = useTheme();

  const buttonStyle = {
    padding: 'var(--ixp-spacing-sm, 0.5rem) var(--ixp-spacing-md, 1rem)',
    backgroundColor: 'var(--ixp-color-primary-main, #007bff)',
    color: 'var(--ixp-color-primary-contrast, #ffffff)',
    border: 'none',
    borderRadius: 'var(--ixp-border-radius, 12px)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--ixp-spacing-xs, 0.25rem)'
  };

  const iconStyle = {
    fontSize: '1rem'
  };

  return (
    <button
      onClick={toggleMode}
      style={buttonStyle}
      className={`theme-toggle ${className}`}
      title={`Switch to ${theme.mode === 'light' ? 'dark' : 'light'} mode`}
      onMouseOver={(e) => {
        e.currentTarget.style.opacity = '0.9';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={iconStyle}>
        {theme.mode === 'light' ? '🌙' : '☀️'}
      </span>
      <span>
        {theme.mode === 'light' ? 'Dark' : 'Light'} Mode
      </span>
    </button>
  );
};

export default ThemeToggle;