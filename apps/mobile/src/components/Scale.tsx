import { Pressable, Text, View } from "react-native";

/** 1..5 tap scale used by the readiness check and mood log. */
export function Scale({ label, value, onChange, low, high }: { label: string; value: number; onChange: (v: number) => void; low: string; high: string }) {
  return (
    <View className="mb-5">
      <Text className="text-ink font-semibold mb-2">{label}</Text>
      <View className="flex-row justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => onChange(n)} className={`w-14 h-14 rounded-2xl items-center justify-center ${value === n ? "bg-field" : "bg-white border border-ink/10"}`}>
            <Text className={`text-lg font-bold ${value === n ? "text-lime" : "text-ink"}`}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row justify-between mt-1"><Text className="text-xs text-ink/50">{low}</Text><Text className="text-xs text-ink/50">{high}</Text></View>
    </View>
  );
}
