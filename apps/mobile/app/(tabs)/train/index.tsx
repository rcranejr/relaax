import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, H2, Muted, Card, Button, Pill } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/store/session";

export default function Train() {
  const plan = trpc.training.todayPlan.useQuery();
  const drills = trpc.training.drills.useQuery();
  const { readinessDoneToday, ceiling, ceilingReasons } = useSession();
  const byId = new Map(drills.data?.map((d) => [d.id, d]));
  const p = plan.data?.plan;

  if (!readinessDoneToday && !p) {
    return (
      <Screen>
        <H1>Train</H1>
        <Card accent><Text className="text-chalk text-lg font-semibold">Check in before you train</Text><Text className="text-chalk/70 mt-1 mb-4">Your plan is built around how you feel today, so this comes first.</Text><Button label="Start readiness check" onPress={() => router.push("/(sheets)/readiness-check")} /></Card>
      </Screen>
    );
  }
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <H1>{p?.theme ?? "Today"}</H1>
        <View className="flex-row flex-wrap">{ceiling && <Pill label={`load: ${ceiling}`} tone={ceiling === "recovery" || ceiling === "rest" ? "warn" : "good"} />}{ceilingReasons.map((r) => <Pill key={r} label={r} />)}</View>
        {p?.sessions.map((s) => (
          <View key={s.slot}>
            <H2>{s.slot} · {s.type.replace("_", " ")} · {s.durationMin} min</H2>
            {s.drills.length === 0 && <Muted>{s.type === "team_practice" ? "Team practice — coach runs this one." : s.type === "game" ? "Game day. Fuel up and go." : "Easy day. Move a little, rest a lot."}</Muted>}
            {s.drills.map((d) => {
              const meta = byId.get(d.drillId);
              return (
                <Card key={d.drillId}>
                  <Text className="font-bold text-ink text-base">{meta?.name ?? d.drillId}</Text>
                  <Text className="text-ink/60 mt-0.5">{d.sets} × {d.reps}{meta ? ` · ${meta.category.replace("_", " ")}` : ""}</Text>
                  {meta && <Text className="text-ink mt-2">{meta.instructions}</Text>}
                  {d.coachNote && <Text className="text-turf font-semibold mt-2">Coach: {d.coachNote}</Text>}
                  <View className="mt-3"><Button variant="ghost" label="Log it" onPress={() => router.push({ pathname: "/(tabs)/train/log", params: { drillId: d.drillId, planId: plan.data!.id, sessionType: s.type, reps: String(d.sets * d.reps) } })} /></View>
                </Card>
              );
            })}
          </View>
        ))}
        {p?.flags.length ? <Muted>Adjusted for today: {p.flags.join("; ")}</Muted> : null}
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
