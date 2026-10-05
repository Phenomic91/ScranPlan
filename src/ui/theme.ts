import { useColorScheme } from 'react-native';

// Palette carried over from Quick Kitchen.
const palette = {
  light: {
    background: '#EEF2EF',
    surface: '#FFFFFF',
    surfaceMuted: '#E4EAE6',
    text: '#13201A',
    textMuted: '#54655C',
    border: '#D2DBD5',
    accent: '#17694A',
    onAccent: '#FFFFFF',
    accentSoft: '#D8EADF',
    danger: '#9A4A06',
    dangerSoft: '#FBE9CF',
  },
  dark: {
    background: '#0E1512',
    surface: '#16201B',
    surfaceMuted: '#1F2C26',
    text: '#E8F0EB',
    textMuted: '#96A99E',
    border: '#2B3B33',
    accent: '#5BD6A0',
    onAccent: '#06251A',
    accentSoft: '#1B3A2D',
    danger: '#F2B84B',
    dangerSoft: '#37290F',
  },
} as const;

export type Colors = { [K in keyof typeof palette.light]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}
