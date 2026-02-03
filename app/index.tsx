import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export default function Index() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkToken() {
      try {
        const token = await SecureStore.getItemAsync("access");
        setHasToken(!!token);
      } catch (error) {
        console.error("INDEX: Error checking token:", error);
        setHasToken(false);
      }
    }
    checkToken();
  }, []);

  useEffect(() => {
    if (hasToken !== null) {
      if (hasToken) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [hasToken, router]);

  return null;
}
