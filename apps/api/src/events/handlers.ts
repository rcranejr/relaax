import { subscribe } from "./bus";
import { notifyParents } from "../services/identity/notify";

export function registerHandlers() {
  subscribe("coach.escalated", async (p) => {
    await notifyParents(p.athleteId, p.kind === "injury"
      ? "Your athlete reported a possible injury to the coach. Their plan is paused until you check in."
      : "Your athlete said something to the coach that we think you should know about. Please check in with them today.");
  });
}
