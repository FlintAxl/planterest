import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const JWT_KEY = 'jwt';

export const setAuthToken = async (token) => {
  await SecureStore.setItemAsync(JWT_KEY, token);
  // Keep a legacy copy so old screens still work while migrating reads.
  await AsyncStorage.setItem(JWT_KEY, token);
};

export const getAuthToken = async () => {
  const secureToken = await SecureStore.getItemAsync(JWT_KEY);
  if (secureToken) {
    return secureToken;
  }

  const legacyToken = await AsyncStorage.getItem(JWT_KEY);
  if (legacyToken) {
    await SecureStore.setItemAsync(JWT_KEY, legacyToken);
  }

  return legacyToken;
};

export const removeAuthToken = async () => {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(JWT_KEY),
    AsyncStorage.removeItem(JWT_KEY),
  ]);
};
