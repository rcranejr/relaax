import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, H2, Muted, Card, Button, Pill } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/store/session";

export default function Home() {
  const me = trpc.identity.me.useQuery();
  const plan = trpc.training.todayPlan.useQuery();
  const dash = trpc.achievements.dashboard.useQuery();
  const { readinessDoneToday, ceiling } = useSession();
  const streak = dash.data?.streaks.find((s) => s.metric === "daily_session");
  const p = plan.data?.plan;
  const selfDirected = p?.sessions.filter((s) => s.type !== "team_practice" && s.type !== "game") ?? [];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Muted>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Muted>
        <H1>Hey {me.data?.profile?.displayName ?? "there"}</H1>

        <Card accent>
          <Text className="text-chalk/70 text-sm">Today's plan</Text>
          <Text className="text-lime text-xl font-bold mt-1">{p?.theme ?? (readinessDoneToday ? "Building your plan…" : "Check in to unlock today's plan")}</Text>
          {ceiling && <View className="flex-row mt-3"><Pill label={`load: ${ceiling}`} tone={ceiling === "high" || ceiling === "moderate" ? "good" : "warn"} /></View>}
          <View className="mt-4">
            {readinessDoneToday
              ? <Button label={p ? "Go to Train" : "Generate plan"} onPress={() => router.push("/(tabs)/train")} />
              : <Button label="How are you feeling today?" onPress={() => router.push("/(sheets)/readiness-check")} />}
          </View>
        </Card>

        {selfDirected.length > 0 && (
          <Card>
            {selfDirected.map((s) => (
              <View key={s.slot} className="flex-row justify-between py-1">
                <Text className="text-ink font-semibold capitalize">{s.slot} · {s.type.replace("_", " ")}</Text>
                <Text className="text-ink/60">{s.durationMin} min · {s.drills.length} drills</Text>
              </View>
            ))}
          </Card>
        )}

        <H2>Streaks</H2>
        <View className="flex-row">
          <Card className="flex-1 mr-2 items-center"><Text className="text-4xl font-black text-field">{streak?.current ?? 0}</Text><Muted>days in a row</Muted></Card>
          <Card className="flex-1 ml-2 items-center"><Text className="text-4xl font-black text-field">{streak?.best ?? 0}</Text><Muted>best streak</Muted></Card>
        </View>

        <H2>Badges</H2>
        <View className="flex-row flex-wrap mb-10">
          {dash.data?.badges.map((b) => (
            <Card key={b.id} className={`w-[48%] mr-[2%] ${b.earned ? "" : "opacity-40"}`}>
              <Text className="font-bold text-ink">{b.name}</Text>
              <Text className="text-ink/60 text-sm">{b.description}</Text>
              {b.treat && b.earned && <Text className="text-clay text-sm mt-1 font-semibold">{b.treat}</Text>}
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
