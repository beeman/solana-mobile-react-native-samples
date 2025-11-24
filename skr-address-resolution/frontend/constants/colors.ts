/**
 * Modern light theme color palette
 * Clean and minimal design system
 */

const primaryBlue = '#2563eb'
const secondaryPurple = '#e9d5ff'
const accentPurple = '#a78bfa'

export const Colors = {
  light: {
    // Backgrounds
    background: '#f8fafc',
    backgroundSecondary: secondaryPurple,
    card: '#ffffff',

    // Primary colors
    primary: primaryBlue,
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',

    // Secondary/Accent colors (purplish)
    secondary: secondaryPurple,
    secondaryDark: '#c4b5fd',
    accent: accentPurple,
    accentLight: '#c4b5fd',
    accentDark: '#9333ea',

    // Text colors
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',

    // Borders and dividers
    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    // Status colors
    success: '#10b981',
    successLight: '#d1fae5',
    error: '#ef4444',
    errorLight: '#fee2e2',
    warning: '#f59e0b',
    warningLight: '#fef3c7',

    // Interactive states
    hover: '#f1f5f9',
    active: '#e2e8f0',

    // Icons
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: primaryBlue,
    tint: primaryBlue,
  },
  dark: {
    // Keep dark mode support for future
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    card: '#1e293b',

    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',

    accent: accentPurple,
    accentLight: '#a78bfa',

    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',

    border: '#334155',
    borderLight: '#1e293b',

    success: '#10b981',
    successLight: '#064e3b',
    error: '#ef4444',
    errorLight: '#7f1d1d',
    warning: '#f59e0b',
    warningLight: '#78350f',

    hover: '#334155',
    active: '#475569',

    icon: '#cbd5e1',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#3b82f6',
    tint: '#3b82f6',
  },
}
