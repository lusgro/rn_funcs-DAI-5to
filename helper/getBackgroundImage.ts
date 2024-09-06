import AsyncStorage from "@react-native-async-storage/async-storage";

export const getBackgroundImage = async (): Promise<string | null> => {
  const backgroundImage = await AsyncStorage.getItem('backgroundImage');
  return backgroundImage;
};