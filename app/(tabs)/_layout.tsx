import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ImageBackground } from 'react-native';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  useEffect(() => {
    async function loadBackgroundImage() {
      const backgroundImage = await AsyncStorage.getItem('backgroundImage');
      if (backgroundImage) {
        setBackgroundImage(backgroundImage);
      }
    }
    loadBackgroundImage();
  }, []);
  
  const colorScheme = useColorScheme();

  return (
    <ImageBackground 
      source={backgroundImage ? { uri: backgroundImage } : undefined}
      style={{ flex: 1 }}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Emergencia',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="change_background"
          options={{
            title: 'Cambiar Fondo',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'color-palette' : 'color-palette-outline'} color={color} />
            ),
          }}
        />
      </Tabs>
    </ImageBackground>
  );
}