import { Pressable, Text, View, type PressableProps } from "react-native";

export function Screen({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`flex-1 bg-chalk px-5 pt-14 ${className}`}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text className="text-ink text-3xl font-bold tracking-tight mb-1">{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Text className="text-ink text-lg font-semibold mt-6 mb-2">{children}</Text>;
}
export function Muted({ children }: { children: React.ReactNode }) {
  return <Text className="text-ink/60 text-base">{children}</Text>;
}

export function Card({ children, accent = false, className = "" }: { children: React.ReactNode; accent?: boolean; className?: string }) {
  return <View className={`rounded-2xl p-4 mb-3 ${accent ? "bg-field" : "bg-white border border-ink/10"} ${className}`}>{children}</View>;
}

export function Button({ label, variant = "primary", ...p }: PressableProps & { label: string; variant?: "primary" | "ghost" | "danger" }) {
  const bg = variant === "primary" ? "bg-lime" : variant === "danger" ? "bg-clay" : "bg-ink/5";
  const fg = variant === "primary" ? "text-field" : variant === "danger" ? "text-white" : "text-ink";
  return (
    <Pressable {...p} className={`rounded-full py-3.5 px-5 items-center active:opacity-80 ${bg} ${p.disabled ? "opacity-40" : ""}`}>
      <Text className={`font-semibold text-base ${fg}`}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" }) {
  const c = tone === "good" ? "bg-lime/40 text-field" : tone === "warn" ? "bg-clay/15 text-clay" : "bg-ink/5 text-ink/70";
  return <Text className={`rounded-full px-2.5 py-1 text-xs font-semibold mr-1.5 mb-1.5 ${c}`}>{label}</Text>;
}

export const BENEFIT_LABEL: Record<string, string> = {
  high_protein: "High protein", sustained_energy: "Sustained energy", muscle_recovery: "Muscle recovery",
  hydration: "Hydration", quick_fuel: "Quick fuel", fiber_rich: "Fiber rich",
};
