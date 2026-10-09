import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, H1, H2, Muted, Card, Button, Pill, BENEFIT_LABEL } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { MealMoment } from "@relaax/schema";

export default function Fuel() {
  const [moment, setMoment] = useState<typeof MealMoment._type>("pre_session");
  const suggest = trpc.nutrition.suggest.useMutation();
  const choose = trpc.nutrition.choose.useMutation();
  const history = trpc.nutrition.history.useQuery();
  const utils = trpc.useUtils();
  const s = suggest.data;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <H1>Fuel</H1>
        <Muted>Three options, built for what's coming up today.</Muted>
        <View className="flex-row flex-wrap mt-4">
          {MealMoment.options.map((m) => (
            <Pressable key={m} onPress={() => setMoment(m)} className={`rounded-full px-3.5 py-2 mr-2 mb-2 ${moment === m ? "bg-field" : "bg-white border border-ink/10"}`}><Text className={moment === m ? "text-lime font-semibold" : "text-ink"}>{m.replace("_", " ")}</Text></Pressable>
          ))}
        </View>
        <View className="flex-row mt-2">
          <View className="flex-1 mr-2"><Button label={suggest.isPending ? "Thinking…" : "What should I eat?"} disabled={suggest.isPending} onPress={() => suggest.mutate({ moment })} /></View>
          <View className="flex-1 ml-2"><Button variant="ghost" label="Eat out near me" onPress={() => router.push({ pathname: "/(tabs)/fuel/eat-out", params: { moment } })} /></View>
        </View>

        {s && (
          <View className="mt-6">
            {s.options.map((o, i) => (
              <Card key={i}>
                <Text className="font-bold text-ink text-base">{o.name}</Text>
                <Text className="text-ink mt-1">{o.description}</Text>
                <Text className="text-ink/60 mt-1">{o.portionGuide}</Text>
                <View className="flex-row flex-wrap mt-2">{o.benefitTags.map((t) => <Pill key={t} label={BENEFIT_LABEL[t] ?? t} tone="good" />)}</View>
                <View className="mt-3"><Button label="I'll have this" onPress={async () => { await choose.mutateAsync({ suggestionId: s.id, chosenIndex: i }); suggest.reset(); utils.nutrition.history.invalidate(); utils.achievements.dashboard.invalidate(); }} /></View>
              </Card>
            ))}
            <Button variant="ghost" label="None of these" onPress={async () => { await choose.mutateAsync({ suggestionId: s.id, chosenIndex: null }); suggest.reset(); }} />
          </View>
        )}

        <H2>Logged today</H2>
        {history.data?.filter((h) => new Date(h.loggedAt).toDateString() === new Date().toDateString()).map((h) => (
          <Card key={h.id}><Text className="font-semibold text-ink">{h.items.map((i) => i.name).join(", ")}</Text><View className="flex-row flex-wrap mt-1">{h.benefitTags.map((t) => <Pill key={t} label={BENEFIT_LABEL[t] ?? t} />)}</View></Card>
        )) ?? <Muted>Nothing yet.</Muted>}
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
