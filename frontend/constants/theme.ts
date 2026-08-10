// theme.ts
// Direct port of the tailwind.config color/spacing/font tokens from
// create_account_boolok_gpt.html — keep this as the single source of truth
// so every screen (register, login, feed, etc.) stays visually consistent.

export type ColorTheme = {
  background: string;
  onBackground: string;
  inverseSurface: string;
  onSurface: string;
  onSurfaceVariant: string;
  secondary: string;
  secondaryContainer: string;
  primary: string;
  primaryFixed: string;
  primaryContainer: string;
  onPrimary: string;
  outline: string;
  outlineVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surface: string;
  error: string;
  success: string;
  isDark: boolean;
};

export const lightColors: ColorTheme = {
  background: '#ffffff',
  onBackground: '#000000',
  inverseSurface: '#0A0F23',
  onSurface: '#0A0F23',
  onSurfaceVariant: '#1C2238',
  secondary: '#1C2238',
  secondaryContainer: '#1C2238',
  primary: '#DAA520',
  primaryFixed: '#F5D060',
  primaryContainer: '#DAA520',
  onPrimary: '#0A0F23',
  outline: '#717680',
  outlineVariant: '#E6E6E6',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#E6E6E6',
  surfaceContainer: '#E6E6E6',
  surfaceContainerHigh: '#E6E6E6',
  surface: '#ffffff',
  error: '#ba1a1a',
  success: '#16a34a',
  isDark: false,
};

export const darkColors: ColorTheme = {
  background: '#0A0F23',
  onBackground: '#ffffff',
  inverseSurface: '#ffffff',
  onSurface: '#ffffff',
  onSurfaceVariant: '#E6E6E6',
  secondary: '#1C2238',
  secondaryContainer: '#1C2238',
  primary: '#DAA520',
  primaryFixed: '#B8860B',
  primaryContainer: '#DAA520',
  onPrimary: '#0A0F23',
  outline: '#8E91A1',
  outlineVariant: '#2A3353',
  surfaceContainerLowest: '#060A16',
  surfaceContainerLow: '#0D142E',
  surfaceContainer: '#1C2238',
  surfaceContainerHigh: '#2A3353',
  surface: '#0A0F23',
  error: '#ba1a1a',
  success: '#16a34a',
  isDark: true,
};

// Default export for backward compatibility where context isn't used yet
export const colors = lightColors;

export const spacing = {
  xs: 4,
  base: 8,
  sm: 12,
  md: 24,
  gutter: 24,
  lg: 40,
  xl: 64,
};

export const radius = {
  default: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

// fontFamily keys map to the Poppins weights loaded via
// @expo-google-fonts/poppins. Load these in App.tsx / _layout.tsx:
//   Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
//   Poppins_700Bold
export const typography = {
  headlineXl: { fontFamily: 'Poppins_700Bold', fontSize: 40, lineHeight: 48, letterSpacing: -0.4 },
  headlineLg: { fontFamily: 'Poppins_700Bold', fontSize: 28, lineHeight: 36, letterSpacing: -0.2 },
  headlineMd: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, lineHeight: 30 },
  headlineSm: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, lineHeight: 26 },
  bodyLg: { fontFamily: 'Poppins_400Regular', fontSize: 17, lineHeight: 26 },
  bodyMd: { fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19 },
  labelMd: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 15, letterSpacing: 0.6 },
};