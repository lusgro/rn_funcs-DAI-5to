import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ImageBackground } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    
  }, [loaded]);
  
  useEffect(() => {
    async function loadBackgroundImage() {
      const backgroundImage = await AsyncStorage.getItem('backgroundImage');
      if (backgroundImage) {
        setBackgroundImage(backgroundImage);
      }
    }
    loadBackgroundImage();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: {
              backgroundColor: 'transparent',
            } }} />
            <Stack.Screen name="+not-found" />
          </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
