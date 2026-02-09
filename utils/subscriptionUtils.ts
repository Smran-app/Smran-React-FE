import Purchases, { PurchasesOffering } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import { Alert } from "react-native";
import { useReminderStore } from "@/store/reminderStore";

export const checkPremiumStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active["Smran Pro"] !== undefined;
  } catch (e) {
    return false;
  }
};

export const presentPaywall = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      const result = await RevenueCatUI.presentPaywall({
        offering: offerings.current,
      });
      // Optionally refresh isPro in store after paywall is dismissed
      await useReminderStore.getState().checkPremiumStatus();
      return result;
    } else {
      Alert.alert("Error", "No offerings available at the moment.");
    }
  } catch (error) {
    console.error("Error presenting paywall:", error);
    Alert.alert("Error", "Could not load paywall. Please try again.");
  }
};

/**
 * Checks if user can perform an action based on their subscription.
 * If not pro and count >= limit, shows paywall and returns false.
 */
export const checkSubscriptionLimit = async (
  currentCount: number,
  limit: number = 5,
) => {
  const isPro = useReminderStore.getState().isPro;
  if (isPro) return true;

  if (currentCount >= limit) {
    await presentPaywall();
    return false;
  }

  return true;
};
