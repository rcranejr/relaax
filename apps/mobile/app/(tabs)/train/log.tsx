import { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, H1, Muted, Button } from "@/components/ui";
import { Scale } from "@/components/Scale";
import { trpc } from "@/lib/trpc";

export default function LogWorkout() {
  const { drillId, planId, sessionType, reps } = useLocalSearchParams<{ drillId: string; planId: string; sessionType: string; reps: string }>();
  const [rpe, setRpe] = useState(3);
  const [rating, setRating] = useState(4);
  const log = trpc.training.logWorkout.useMutation();
  const utils = trpc.useUtils();
  return (
    <Screen>
      <H1>Nice work</H1>
      <Muted>Two quick taps so tomorrow's plan learns from today.</Muted>
      <View className="mt-6">
        <Scale label="How hard was it?" value={rpe} onChange={setRpe} low="easy" high="all out" />
        <Scale label="Did you like this drill?" value={rating} onChange={setRating} low="nope" high="loved it" />
      </View>
      <Button label="Save" disabled={log.isPending} onPress={async () => {
        const r = await log.mutateAsync({ drillId, planId, sessionType: sessionType ?? "skills", reps: Number(reps) || undefined, rpe: rpe * 2, rating });
        await utils.achievements.dashboard.invalidate();
        if (r.streak.newAwards.length) alert(`New badge: ${r.streak.newAwards.join(", ")}`);
        router.back();
      }} />
      {log.data && <Text className="mt-4 text-turf font-semibold">Streak: {log.data.streak.current} days</Text>}
    </Screen>
  );
}
