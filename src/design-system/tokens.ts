export const Colors = {
  brand: {
    primary: '#4A7C59',
    dark: '#2C5C3F',
    light: '#D6EDE1',
  },
  accent: {
    primary: '#E8834A',
    light: '#FDEBD0',
  },
  neutral: {
    50: '#F0F5F2',
    100: '#E4EDE8',
    200: '#C8D9CE',
    300: '#A0B8AA',
    400: '#7A9887',
    500: '#5A7A66',
    600: '#3E5C49',
    700: '#2E4436',
    800: '#243628',
    900: '#1C2B22',
  },
  white: '#FFFFFF',
  error: '#E53935',
  warning: '#F5A623',
  success: '#34C759',
  background: '#FAF8F4',
  text: {
    primary: '#1C2B22',
    secondary: '#8E8E93',
  },
};

export const Spacing = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s48: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const Fonts = {
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  nunito: {
    regular: 'Nunito_400Regular',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
  },
};

export const Typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontFamily: Fonts.nunito.extraBold, letterSpacing: 0.37 },
  title1: { fontSize: 28, lineHeight: 34, fontFamily: Fonts.nunito.bold },
  title2: { fontSize: 22, lineHeight: 28, fontFamily: Fonts.nunito.bold },
  title3: { fontSize: 20, lineHeight: 25, fontFamily: Fonts.nunito.semiBold },
  headline: { fontSize: 17, lineHeight: 22, fontFamily: Fonts.inter.semiBold },
  body: { fontSize: 17, lineHeight: 22, fontFamily: Fonts.inter.regular },
  callout: { fontSize: 16, lineHeight: 21, fontFamily: Fonts.inter.regular },
  subheadline: { fontSize: 15, lineHeight: 20, fontFamily: Fonts.inter.regular },
  footnote: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.inter.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: Fonts.inter.regular },
};
