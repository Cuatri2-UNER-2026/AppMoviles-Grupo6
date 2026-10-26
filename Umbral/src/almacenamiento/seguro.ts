import * as SecureStore from "expo-secure-store";

const CLAVE = "token_sesion";

export const obtenerToken = () => SecureStore.getItemAsync(CLAVE);
export const guardarToken = (token: string) => SecureStore.setItemAsync(CLAVE, token);
export const borrarToken = () => SecureStore.deleteItemAsync(CLAVE);