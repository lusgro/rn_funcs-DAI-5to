import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BackgroundContextType = {
  backgroundImage: string | null;
  updateBackgroundImage: (uri: string) => Promise<void>;
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('backgroundImage').then((image) => {
      if (image) setBackgroundImage(image);
    });
  }, []);

  const updateBackgroundImage = async (uri: string) => {
    await AsyncStorage.setItem('backgroundImage', uri);
    setBackgroundImage(uri);
  };

  return (
    <BackgroundContext.Provider value={{ backgroundImage, updateBackgroundImage }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};