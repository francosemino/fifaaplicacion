/**
 * Global theme tokens for the FIFA/EA FC Tournament app
 * Dark gaming/football aesthetic with gold/silver/bronze accents.
 */
export const colors = {
  bg: '#0A0B0E',
  surface: '#12141A',
  surfaceElevated: '#1A1D27',
  border: '#2A2D3A',
  text: '#F5F6FA',
  textSecondary: '#9E9FA6',
  textMuted: '#5A5D6B',
  gold: '#D4AF37',
  goldLight: '#F5D76E',
  goldDark: '#AA8111',
  silver: '#C0C7D1',
  silverDark: '#6B7280',
  bronze: '#B45309',
  danger: '#EF4444',
  success: '#10B981',
  info: '#38BDF8',
  overlay: 'rgba(0,0,0,0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const fonts = {
  heading: 'Unbounded_700Bold',
  headingBlack: 'Unbounded_900Black',
  body: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

/** Tier color helper for medals */
export const tierColor = (tier: 'gold' | 'silver' | 'bronze') => {
  if (tier === 'gold') return colors.gold;
  if (tier === 'silver') return colors.silver;
  return colors.bronze;
};

/** Fixed palette for player avatars (when no photo) */
export const avatarPalette = [
  '#D4AF37', '#38BDF8', '#F472B6', '#22D3EE',
  '#A78BFA', '#FB923C', '#34D399', '#F87171',
];
