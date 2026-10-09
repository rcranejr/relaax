import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, Muted, Button } from "@/components/ui";
import { Scale } from "@/components/Scale";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/store/session";
import { BodyRegion } from "@relaax/schema";

export default function ReadinessCheck() {
  const [sleepQuality, setSleep] = useState(3);
  const [fatigue, setFatigue] = useState(2);
  const [energy, setEnergy] = useState(4);
  const [painFlag, setPain] = useState(false);
  const [sore, setSore] = useState<string[]>([]);
  const submit = trpc.health.submitReadiness.useMutation();
  const generate = trpc.training.generatePlan.useMutation();
  const utils = trpc.useUtils();
  const setReadiness = useSession((s) => s.setReadiness);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <H1>How's your body today?</H1>
        <Muted>30 seconds. This sets how hard today's plan can be.</Muted>
        <View className="mt-6">
          <Scale label="Sleep last night" value={sleepQuality} onChange={setSleep} low="rough" high="great" />
          <Scale label="How tired do you feel?" value={fatigue} onChange={setFatigue} low="fresh" high="wiped" />
          <Scale label="Energy right now" value={energy} onChange={setEnergy} low="low" high="fired up" />
        </View>
        <Text className="text-ink font-semibold mb-2">Anything sore?</Text>
        <View className="flex-row flex-wrap mb-4">
          {BodyRegion.options.map((r) => {
            const on = sore.includes(r);
            return <Pressable key={r} onPress={() => setSore(on ? sore.filter((x) => x !== r) : [...sore, r])} className={`rounded-full px-3 py-1.5 mr-2 mb-2 ${on ? "bg-clay" : "bg-white border border-ink/10"}`}><Text className={on ? "text-white font-semibold" : "text-ink"}>{r}</Text></Pressable>;
          })}
        </View>
        <View className="flex-row items-center justify-between bg-white border border-ink/10 rounded-xl px-4 py-3 mb-6">
          <View className="flex-1 pr-3"><Text className="font-semibold text-ink">Any actual pain (not just sore)?</Text><Text className="text-ink/50 text-sm">If yes, today is recovery and we'll tell a parent.</Text></View>
          <Switch value={painFlag} onValueChange={setPain} trackColor={{ true: "#E6572E" }} />
        </View>
        <Button label={submit.isPending || generate.isPending ? "Building your day…" : "Build my day"} disabled={submit.isPending || generate.isPending} onPress={async () => {
          const r = await submit.mutateAsync({ sleepQuality, fatigue, energy, painFlag, sore });
          setReadiness(r.ceiling, r.reasons);
          await generate.mutateAsync();
          await utils.training.todayPlan.invalidate();
          router.back();
        }} />
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
