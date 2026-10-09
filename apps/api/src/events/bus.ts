/**
 * Event bus. Local: in-process EventEmitter. Production: swap `publish` for an EventBridge PutEvents
 * call; consumers in jobs/ read from SQS. Names are the contract.
 */
import { EventEmitter } from "node:events";

export type Events = {
  "plan.issued": { athleteId: string; planId: string };
  "workout.completed": { athleteId: string; drillId?: string };
  "meal.logged": { athleteId: string };
  "readiness.submitted": { athleteId: string; ceiling: string };
  "coach.escalated": { athleteId: string; kind: string; sessionId: string };
};

const bus = new EventEmitter();

export async function publish<K extends keyof Events>(name: K, payload: Events[K]) {
  bus.emit(name, payload);
}
export function subscribe<K extends keyof Events>(name: K, fn: (p: Events[K]) => void | Promise<void>) {
  bus.on(name, (p) => void fn(p));
}
