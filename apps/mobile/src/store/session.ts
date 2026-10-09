import { create } from "zustand";
import type { LoadCeiling } from "@relaax/schema";

interface SessionState {
  readinessDoneToday: boolean;
  ceiling: LoadCeiling | null;
  ceilingReasons: string[];
  coachSessionId: string | null;
  setReadiness: (c: LoadCeiling, reasons: string[]) => void;
  setCoachSession: (id: string) => void;
}

export const useSession = create<SessionState>((set) => ({
  readinessDoneToday: false,
  ceiling: null,
  ceilingReasons: [],
  coachSessionId: null,
  setReadiness: (ceiling, ceilingReasons) => set({ readinessDoneToday: true, ceiling, ceilingReasons }),
  setCoachSession: (coachSessionId) => set({ coachSessionId }),
}));
