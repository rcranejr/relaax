import { useEffect, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, H1, Muted, Card, Button, Pill, BENEFIT_LABEL } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import type { MealMoment } from "@relaax/schema";

export default function EatOut() {
  const { moment } = useLocalSearchParams<{ moment: MealMoment }>();
  const [status, setStatus] = useState("Finding you…");
  const eatOut = trpc.nutrition.eatOut.useMutation();
  const choose = trpc.nutrition.choose.useMutation();

  useEffect(() => {
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") { setStatus("Location is off. Turn it on in Settings to use Eat Out."); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setStatus("Checking menus nearby…");
      eatOut.mutate({ moment: moment ?? "regular", lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const r = eatOut.data;
  const place = (id?: string) => r?.restaurants.find((p) => p.placeId === id);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <H1>Eat out</H1>
        {!r && <Muted>{eatOut.error ? eatOut.error.message : status}</Muted>}
        {r && !r.suggestion && <Muted>No restaurants found nearby. Try again in a different spot.</Muted>}
        {r?.suggestion?.options.map((o, i) => {
          const p = place(o.restaurantPlaceId);
          return (
            <Card key={i}>
              <Text className="text-ink/60 text-sm">{p?.name ?? "Nearby"} · {Math.round((o.distanceM ?? 0) / 100) / 10} km{p?.rating ? ` · ★ ${p.rating}` : ""}</Text>
              <Text className="font-bold text-ink text-base mt-0.5">{o.menuItemName ?? o.name}</Text>
              <Text className="text-ink mt-1">{o.description}</Text>
              <View className="flex-row flex-wrap mt-2">{o.benefitTags.map((t) => <Pill key={t} label={BENEFIT_LABEL[t] ?? t} tone="good" />)}</View>
              <View className="flex-row mt-3">
                <View className="flex-1 mr-2"><Button label="Going here" onPress={async () => { await choose.mutateAsync({ suggestionId: r.suggestion!.id, chosenIndex: i }); router.back(); }} /></View>
                {p && <View className="flex-1 ml-2"><Button variant="ghost" label="Directions" onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&destination_place_id=${p.placeId}`)} /></View>}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
