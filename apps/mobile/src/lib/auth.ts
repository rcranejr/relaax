import * as SecureStore from "expo-secure-store";

/**
 * Clerk token cache. In local dev with no Clerk key, a "dev:<id>" token is stored so the API's
 * dev shortcut accepts it (see apps/api/src/gateway/context.ts).
 */
export const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export const DEV_TOKEN_KEY = "relaax.devToken";
export async function getDevToken() { return SecureStore.getItemAsync(DEV_TOKEN_KEY); }
export async function setDevToken(id: string) { await SecureStore.setItemAsync(DEV_TOKEN_KEY, `dev:${id}`); }
