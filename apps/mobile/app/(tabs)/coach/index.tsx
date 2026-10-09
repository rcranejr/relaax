import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, Button } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/store/session";

export default function Coach() {
  const { coachSessionId, setCoachSession } = useSession();
  const open = trpc.coach.openSession.useMutation();
  const send = trpc.coach.send.useMutation();
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string; escalated?: boolean }[]>([
    { role: "assistant", content: "Hey. I'm Coach Lax. Ask me about training, fuel, nerves before a game, anything lacrosse. How are you feeling today?" },
  ]);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => { if (!coachSessionId) open.mutateAsync().then((r) => setCoachSession(r.sessionId)); }, []);

  const submit = async () => {
    if (!text.trim() || !coachSessionId) return;
    const message = text.trim(); setText("");
    setMsgs((m) => [...m, { role: "user", content: message }]);
    const r = await send.mutateAsync({ sessionId: coachSessionId, message });
    setMsgs((m) => [...m, { role: "assistant", content: r.reply, escalated: r.escalated }]);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <Screen className="pb-4">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1" keyboardVerticalOffset={80}>
        <View className="flex-row justify-between items-end"><H1>Coach</H1><Button variant="ghost" label="Mood check" onPress={() => router.push("/(tabs)/coach/mood")} /></View>
        <ScrollView ref={scroll} className="flex-1 mt-2" showsVerticalScrollIndicator={false}>
          {msgs.map((m, i) => (
            <View key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 mb-2 ${m.role === "user" ? "self-end bg-field" : m.escalated ? "self-start bg-clay/15 border border-clay" : "self-start bg-white border border-ink/10"}`}>
              <Text className={m.role === "user" ? "text-chalk" : "text-ink"}>{m.content}</Text>
            </View>
          ))}
          {send.isPending && <Text className="text-ink/40 ml-2">Coach is typing…</Text>}
        </ScrollView>
        <View className="flex-row items-center mt-2">
          <TextInput value={text} onChangeText={setText} onSubmitEditing={submit} placeholder="Ask Coach Lax…" className="flex-1 bg-white border border-ink/10 rounded-full px-4 py-3 mr-2" returnKeyType="send" />
          <Button label="Send" onPress={submit} disabled={!coachSessionId || send.isPending} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
