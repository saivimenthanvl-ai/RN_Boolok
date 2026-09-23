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
  background: '#F8FAFC',          // Elegant, clean off-white canvas (Slate 50)
  onBackground: '#0F172A',        // Deep Slate 900 for high-contrast crisp text
  inverseSurface: '#0F172A',
  onSurface: '#0F172A',           // Slate 900
  onSurfaceVariant: '#475569',    // Slate 600 for secondary text
  secondary: '#1E293B',           // Slate 800
  secondaryContainer: '#F1F5F9',  // Slate 100
  primary: '#D97706',             // Warm, professional luxury gold/amber
  primaryFixed: '#F59E0B',        // Amber 500
  primaryContainer: '#D97706',    // Warm luxury gold/amber container (matches primary)
  onPrimary: '#FFFFFF',           // Crisp white text on primary
  outline: '#94A3B8',             // Slate 400
  outlineVariant: '#E2E8F0',      // Slate 200 - refined micro borders
  surfaceContainerLowest: '#FFFFFF', // Pure white card surface
  surfaceContainerLow: '#F8FAFC',
  surfaceContainer: '#F1F5F9',
  surfaceContainerHigh: '#E2E8F0',
  surface: '#FFFFFF',             // Pure white card surfaces
  error: '#DC2626',
  success: '#16A34A',
  isDark: false,
};

export const darkColors: ColorTheme = {
  background: '#060B13',
  onBackground: '#FFFFFF',
  inverseSurface: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#94A3B8',
  secondary: '#1C2238',
  secondaryContainer: '#1C2238',
  primary: '#DAA520',
  primaryFixed: '#B8860B',
  primaryContainer: '#DAA520',
  onPrimary: '#0A0F23',
  outline: '#8E91A1',
  outlineVariant: '#1E293B',
  surfaceContainerLowest: '#060A16',
  surfaceContainerLow: '#0D142E',
  surfaceContainer: '#162235',
  surfaceContainerHigh: '#2A3353',
  surface: '#0C1626',
  error: '#EF4444',
  success: '#22C55E',
  isDark: true,
};

// Cross-platform shadows (iOS shadow*, Android elevation, and Web boxShadow)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  gold: {
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
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
  xxl: 80,
};

export const radius = {
  default: 4,
  sm: 4,
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
  labelLg: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, lineHeight: 20, letterSpacing: 0.4 },
  labelMd: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 15, letterSpacing: 0.6 },
};