import { Tabs } from "expo-router";
import { Text } from "react-native";

const icon = (glyph: string) => ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#0E3B2E", tabBarInactiveTintColor: "#8A8F8C", tabBarStyle: { backgroundColor: "#F5F4EE", borderTopColor: "#E2E1DA" } }}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: icon("⌂") }} />
      <Tabs.Screen name="coach" options={{ title: "Coach", tabBarIcon: icon("◉") }} />
      <Tabs.Screen name="train" options={{ title: "Train", tabBarIcon: icon("▲") }} />
      <Tabs.Screen name="fuel" options={{ title: "Fuel", tabBarIcon: icon("◆") }} />
      <Tabs.Screen name="recruit" options={{ title: "Recruit", tabBarIcon: icon("▶") }} />
    </Tabs>
  );
}
