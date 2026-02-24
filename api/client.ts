import * as SecureStore from "expo-secure-store";

export const BASE_URL = "https://smran-python-be-udjy.onrender.com";
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
      console.log(errorText);
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const text = await response.text();
    try {
      return text ? JSON.parse(text) : ({} as T);
    } catch (e) {
      return text as any as T;
    }
  } catch (error) {
    throw error;
  }
};
