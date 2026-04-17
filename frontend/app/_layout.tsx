import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Unbounded_700Bold, Unbounded_900Black } from '@expo-google-fonts/unbounded';
import { Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { View } from 'react-native';
import { colors } from '../src/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  // Fonts load in background; app renders with system fallback meanwhile.
  useFonts({
    Unbounded_700Bold,
    Unbounded_900Black,
    Manrope_500Medium,
    Manrope_700Bold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
