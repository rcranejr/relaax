import "../src/theme/global.css";
import { useMemo } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { trpc, makeTrpcClient } from "@/lib/trpc";
import { tokenCache, getDevToken } from "@/lib/auth";

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function Providers({ children }: { children: React.ReactNode }) {
  const auth = CLERK_KEY ? useAuth() : null;
  const queryClient = useMemo(() => new QueryClient(), []);
  const client = useMemo(() => makeTrpcClient(async () => (auth ? await auth.getToken() : await getDevToken())), [auth]);
  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export default function RootLayout() {
  const tree = (
    <Providers>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(sheets)" options={{ presentation: "modal" }} />
      </Stack>
    </Providers>
  );
  return CLERK_KEY ? <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>{tree}</ClerkProvider> : tree;
}
