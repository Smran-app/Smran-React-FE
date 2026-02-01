import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
// import ReceiveSharingIntent from "react-native-receive-sharing-intent";
export default function Index() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkToken() {
      try {
        const token = await SecureStore.getItemAsync("access");
        setHasToken(!!token);
      } catch (error) {
        console.error("Error checking token:", error);
        setHasToken(false);
      }
    }
    checkToken();
  }, []);

  // useEffect(() => {
  //   ReceiveSharingIntent.getReceivedFiles(
  //     (data: any) => {
  //       console.log("RECEIVED_INTENT", data);
  //     },
  //     (err: any) => {
  //       console.log(err);
  //     },
  //   );

  //   return () => {
  //     ReceiveSharingIntent.clearReceivedFiles();
  //   };
  // }, []);

  if (hasToken === null) {
    return null; // Or a splash screen/loading indicator
  }

  return <Redirect href={hasToken ? "/(tabs)" : "/onboarding"} />;
}
