import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, Muted, Card, Button } from "@/components/ui";

const CLIP_TYPES = [
  { id: "game_highlight", name: "Game highlight", tip: "Film from the stands, landscape, keep the whole play in frame. 10 to 20 s per clip." },
  { id: "agility_test", name: "Agility test", tip: "5-10-5 shuttle or L-drill. Show the stopwatch at the end." },
  { id: "stick_skills", name: "Stick skills", tip: "Wall ball both hands, 30 s each. Camera at chest height." },
];

export default function Recruit() {
  return (
    <Screen>
      <H1>Recruit</H1>
      <Muted>Clips stay private to you and your parent until a parent turns on sharing. Full capture and reels ship in Phase 3.</Muted>
      <View className="mt-6">
        {CLIP_TYPES.map((c) => (
          <Card key={c.id}>
            <Text className="font-bold text-ink text-base">{c.name}</Text>
            <Text className="text-ink/70 mt-1">{c.tip}</Text>
            <View className="mt-3"><Button variant="ghost" label="Record" onPress={() => router.push({ pathname: "/(tabs)/recruit/capture", params: { clipType: c.id } })} /></View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
