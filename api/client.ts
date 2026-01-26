import * as SecureStore from "expo-secure-store";

export const BASE_URL = "https://smran-python-be.onrender.com";

interface FetchOptions extends RequestInit {
  timeout?: number;
  useAuth?: boolean;
}

export const apiClient = async <T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const { timeout = 10000, useAuth = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set("Content-Type", "application/json");

  if (useAuth) {
    const token = await SecureStore.getItemAsync("access");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
