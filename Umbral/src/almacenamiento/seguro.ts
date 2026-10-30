import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLAVE = 'token_sesion';

export const obtenerToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(CLAVE);
    } catch {
      return null;
    }
  }
  return await SecureStore.getItemAsync(CLAVE);
};

export const guardarToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(CLAVE, token);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(CLAVE, token);
};

export const borrarToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(CLAVE);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(CLAVE);
};