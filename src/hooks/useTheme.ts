import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';

export function useTheme() {
  const scheme = useColorScheme();
  return {
    isDark: scheme === 'dark',
    colors: Colors,
  };
}
