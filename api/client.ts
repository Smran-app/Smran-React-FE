import * as SecureStore from "expo-secure-store";

export const BASE_URL = "https://3268e2082bcc.ngrok-free.app";
// export const BASE_URL = "https://0adb10de3561.ngrok-free.app";

interface FetchOptions extends RequestInit {
  useAuth?: boolean;
}

export const apiClient = async <T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const { useAuth = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set("Content-Type", "application/json");

  if (useAuth) {
    const token = await SecureStore.getItemAsync("access");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    throw error;
  }
};
