import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";
import Constants from "expo-constants";
import type { AppRouter } from "@relaax/api";

export const trpc = createTRPCReact<AppRouter>();

const url = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4000";

export function makeTrpcClient(getToken: () => Promise<string | null>, athleteId?: string) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${url}/trpc`,
        transformer: superjson,
        async headers() {
          const token = await getToken();
          return { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(athleteId ? { "x-athlete-id": athleteId } : {}) };
        },
      }),
    ],
  });
}
