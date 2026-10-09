import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, Muted, Button } from "@/components/ui";
import { trpc } from "@/lib/trpc";

const MOODS = [["great", "🔥"], ["good", "🙂"], ["ok", "😐"], ["low", "😕"], ["rough", "😞"]] as const;
const TRIGGERS = ["school", "game nerves", "tired", "friends", "family", "injury worry"];

export default function Mood() {
  const [mood, setMood] = useState<(typeof MOODS)[number][0]>("good");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const log = trpc.health.logMood.useMutation();
  return (
    <Screen>
      <H1>Quick mood check</H1>
      <Muted>Only you and your parent can ever see this.</Muted>
      <View className="flex-row justify-between mt-6 mb-6">
        {MOODS.map(([m, e]) => <Pressable key={m} onPress={() => setMood(m)} className={`w-14 h-14 rounded-2xl items-center justify-center ${mood === m ? "bg-field" : "bg-white border border-ink/10"}`}><Text className="text-2xl">{e}</Text></Pressable>)}
      </View>
      <Text className="font-semibold mb-2">What's on your mind?</Text>
      <View className="flex-row flex-wrap mb-4">
        {TRIGGERS.map((t) => { const on = triggers.includes(t); return <Pressable key={t} onPress={() => setTriggers(on ? triggers.filter((x) => x !== t) : [...triggers, t])} className={`rounded-full px-3 py-1.5 mr-2 mb-2 ${on ? "bg-field" : "bg-white border border-ink/10"}`}><Text className={on ? "text-lime font-semibold" : "text-ink"}>{t}</Text></Pressable>; })}
      </View>
      <TextInput value={note} onChangeText={setNote} placeholder="Anything else? (optional)" multiline className="bg-white border border-ink/10 rounded-xl px-4 py-3 h-24 mb-6" />
      <Button label="Save" disabled={log.isPending} onPress={async () => { await log.mutateAsync({ mood, triggers, note: note || undefined }); router.back(); }} />
    </Screen>
  );
}
