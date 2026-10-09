import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, Muted, Button, Card } from "@/components/ui";
import { trpc } from "@/lib/trpc";

export default function ParentInvite() {
  const invite = trpc.identity.inviteParent.useMutation();
  const me = trpc.identity.me.useQuery();
  return (
    <Screen>
      <H1>A parent needs to say yes first</H1>
      <Muted>Because you're under 18, a parent or guardian confirms your account before you can train. Share this code with them.</Muted>
      <Card accent className="mt-8 items-center py-8">
        <Text className="text-lime text-3xl font-black tracking-widest">{invite.data?.inviteCode.slice(0, 8).toUpperCase() ?? "— — — —"}</Text>
        <Text className="text-chalk/70 mt-2">Invite code</Text>
      </Card>
      {!invite.data && <Button label="Create invite code" onPress={() => invite.mutate({ relationship: "parent" })} />}
      <View className="mt-4">
        <Button variant="ghost" label="My parent said yes, check again" onPress={async () => { const r = await me.refetch(); if (r.data?.user.status === "active") router.replace("/(onboarding)/profile"); }} />
      </View>
      <Text className="text-ink/50 text-sm mt-6">Parents confirm at relaax.app/parent with this code. What we store and why: relaax.app/privacy</Text>
    </Screen>
  );
}
