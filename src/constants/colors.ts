export const Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#60A5FA',
  secondary: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#0EA5E9',
} as const;

export type ColorName = keyof typeof Colors;
