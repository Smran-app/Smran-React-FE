import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to onboarding for initial flow demonstration
  return <Redirect href="/onboarding" />;
}
