import { Tabs } from "expo-router";
import { TabBar } from "../../components/TabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        // Transparent background for the tab view so gradient shows through
        sceneStyle: { backgroundColor: "transparent" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "New",
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: "Voice Input",
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
        }}
      />
    </Tabs>
  );
}
