import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, H2, Button, Muted } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { Position } from "@relaax/schema";

const CUISINES = ["american", "mexican", "italian", "asian", "mediterranean"];

export default function Profile() {
  const [displayName, setName] = useState("");
  const [position, setPosition] = useState<typeof Position._type>("midfield");
  const [gradYear, setGradYear] = useState("2030");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const upsert = trpc.identity.upsertProfile.useMutation();
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <H1>Set up your player card</H1>
        <Muted>Just lacrosse stuff. No weight, no measurements.</Muted>
        <H2>First name or nickname</H2>
        <TextInput value={displayName} onChangeText={setName} className="bg-white border border-ink/10 rounded-xl px-4 py-3" />
        <H2>Position</H2>
        <View className="flex-row flex-wrap">
          {Position.options.map((p) => (
            <Pressable key={p} onPress={() => setPosition(p)} className={`rounded-full px-4 py-2 mr-2 mb-2 ${position === p ? "bg-field" : "bg-white border border-ink/10"}`}>
              <Text className={position === p ? "text-lime font-semibold" : "text-ink"}>{p.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <H2>Graduation year</H2>
        <TextInput value={gradYear} onChangeText={setGradYear} keyboardType="number-pad" className="bg-white border border-ink/10 rounded-xl px-4 py-3" />
        <H2>Food you like</H2>
        <View className="flex-row flex-wrap">
          {CUISINES.map((c) => {
            const on = cuisines.includes(c);
            return (
              <Pressable key={c} onPress={() => setCuisines(on ? cuisines.filter((x) => x !== c) : [...cuisines, c])} className={`rounded-full px-4 py-2 mr-2 mb-2 ${on ? "bg-field" : "bg-white border border-ink/10"}`}>
                <Text className={on ? "text-lime font-semibold" : "text-ink"}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-8 mb-10">
          <Button label="Let's go" disabled={!displayName || upsert.isPending} onPress={async () => {
            await upsert.mutateAsync({ displayName, primaryPosition: position, graduationYear: Number(gradYear), cuisinePrefs: cuisines, dietaryPattern: "none", level: 1, goals: [] });
            router.replace("/(tabs)/home");
          }} />
        </View>
      </ScrollView>
    </Screen>
  );
}
