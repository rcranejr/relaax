import { Redirect } from "expo-router";
import { trpc } from "@/lib/trpc";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const me = trpc.identity.me.useQuery(undefined, { retry: false });
  if (me.isLoading) return <View className="flex-1 items-center justify-center bg-chalk"><ActivityIndicator /></View>;
  if (me.isError || !me.data) return <Redirect href="/(onboarding)/welcome" />;
  if (me.data.user.status === "pending_consent") return <Redirect href="/(onboarding)/parent-invite" />;
  if (!me.data.profile) return <Redirect href="/(onboarding)/profile" />;
  return <Redirect href="/(tabs)/home" />;
}
