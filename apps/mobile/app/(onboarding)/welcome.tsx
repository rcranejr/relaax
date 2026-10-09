import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, Muted, Button } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { setDevToken } from "@/lib/auth";

/**
 * Dev sign-in. With a Clerk key present this screen is replaced by Clerk's <SignUp/>;
 * the register mutation runs the same way after Clerk returns a user id.
 */
export default function Welcome() {
  const [dob, setDob] = useState("2012-03-14");
  const [id, setId] = useState("athlete-1");
  const register = trpc.identity.register.useMutation();
  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="text-lime text-6xl font-black tracking-tighter bg-field self-start px-3 rounded-xl mb-3">ReLaax</Text>
        <H1>Train smart. Fuel right. Get seen.</H1>
        <Muted>Your daily plan, built around how you feel today.</Muted>
        <Text className="mt-8 mb-1 font-semibold">Date of birth</Text>
        <TextInput value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" className="bg-white border border-ink/10 rounded-xl px-4 py-3 mb-3" />
        <Text className="mb-1 font-semibold">Dev user id</Text>
        <TextInput value={id} onChangeText={setId} autoCapitalize="none" className="bg-white border border-ink/10 rounded-xl px-4 py-3 mb-6" />
        <Button label={register.isPending ? "Creating…" : "Get started"} disabled={register.isPending} onPress={async () => {
          await setDevToken(id);
          const r = await register.mutateAsync({ authProviderId: `dev:${id}`, role: "athlete", dateOfBirth: new Date(dob) });
          router.replace(r.needsParentConsent ? "/(onboarding)/parent-invite" : "/(onboarding)/profile");
        }} />
        {register.error && <Text className="text-clay mt-3">{register.error.message}</Text>}
      </View>
    </Screen>
  );
}
