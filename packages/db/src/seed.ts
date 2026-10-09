import { createCoreDb } from "./index";
import { drills, achievements } from "./core";

const DRILLS: (typeof drills.$inferInsert)[] = [
  { id: "wb-quick-stick-1", name: "Quick Stick, Strong Hand", category: "wall_ball", positions: [], load: "light", bodyRegions: ["wrists"], levelMin: 1, levelMax: 5, tags: ["timed", "solo"], instructions: "6 ft from the wall, catch and release in one motion. Strong hand only.", defaultSets: 3, defaultReps: 50 },
  { id: "wb-quick-stick-3", name: "Quick Stick, Both Hands", category: "wall_ball", positions: [], load: "light", bodyRegions: ["wrists"], levelMin: 2, levelMax: 5, tags: ["timed", "solo"], instructions: "Alternate hands every 10 reps. Eyes up on the last set.", defaultSets: 3, defaultReps: 50 },
  { id: "wb-split-dodge", name: "Wall Ball Split Dodge", category: "wall_ball", positions: ["attack", "midfield"], load: "light", bodyRegions: ["ankles"], levelMin: 3, levelMax: 5, tags: ["competitive"], instructions: "Catch, split dodge, switch hands, throw. Both directions.", defaultSets: 4, defaultReps: 10 },
  { id: "stick-cradle-run", name: "Cradle on the Run", category: "stick", positions: [], load: "light", bodyRegions: [], levelMin: 1, levelMax: 3, tags: ["solo"], instructions: "Jog 20 yards cradling, switch hands at each cone.", defaultSets: 3, defaultReps: 6 },
  { id: "stick-split-dodge-1", name: "Split Dodge Progression", category: "stick", positions: ["attack", "midfield"], load: "light", bodyRegions: ["ankles", "knees"], levelMin: 2, levelMax: 5, tags: ["competitive"], instructions: "Plant outside foot, snap hips, protect the stick through the dodge.", defaultSets: 4, defaultReps: 8 },
  { id: "fw-ladder-2", name: "Agility Ladder: Ickey Shuffle", category: "footwork", positions: [], load: "moderate", bodyRegions: ["calves", "ankles"], levelMin: 1, levelMax: 5, tags: ["timed"], instructions: "Two feet in, one out, stay on the balls of your feet.", defaultSets: 4, defaultReps: 2 },
  { id: "fw-goalie-arc", name: "Goalie Arc Steps", category: "footwork", positions: ["goalie"], load: "moderate", bodyRegions: ["calves"], levelMin: 1, levelMax: 5, tags: ["position"], instructions: "Step to each pipe and back along the arc, stick up, hands out.", defaultSets: 3, defaultReps: 10 },
  { id: "vision-scan-pass", name: "Scan and Pass", category: "vision", positions: ["midfield", "attack", "defense"], load: "light", bodyRegions: [], levelMin: 2, levelMax: 5, tags: ["partner"], instructions: "Partner calls a color as you catch; pass to the matching cone.", defaultSets: 3, defaultReps: 12 },
  { id: "cond-shuttle-20", name: "20-Yard Shuttles", category: "conditioning", positions: [], load: "high", bodyRegions: ["hamstrings", "calves"], levelMin: 2, levelMax: 5, tags: ["timed"], instructions: "Down and back twice, 30 s rest.", defaultSets: 6, defaultReps: 1 },
  { id: "cond-tempo-run", name: "Tempo Run", category: "conditioning", positions: [], load: "moderate", bodyRegions: ["calves", "quads"], levelMin: 1, levelMax: 5, tags: ["long_run"], instructions: "12 minutes at a pace you could talk through.", defaultSets: 1, defaultReps: 1 },
  { id: "str-bw-squat", name: "Bodyweight Squats", category: "strength", positions: [], load: "moderate", bodyRegions: ["quads", "knees"], levelMin: 1, levelMax: 5, loaded: false, tags: [], instructions: "Chest up, knees over toes, full depth.", defaultSets: 3, defaultReps: 12 },
  { id: "str-goblet-squat", name: "Goblet Squat", category: "strength", positions: [], load: "high", bodyRegions: ["quads", "knees", "back"], levelMin: 3, levelMax: 5, loaded: true, tags: [], instructions: "Light dumbbell at the chest. Supervision required.", defaultSets: 3, defaultReps: 8 },
  { id: "rec-calf-mobility-1", name: "Calf and Ankle Mobility", category: "recovery", positions: [], load: "rest", bodyRegions: [], levelMin: 1, levelMax: 5, tags: [], instructions: "Wall calf stretch 30 s each side, ankle circles 10 each way.", defaultSets: 1, defaultReps: 1 },
  { id: "rec-hip-flow", name: "Hip Flow", category: "recovery", positions: [], load: "rest", bodyRegions: [], levelMin: 1, levelMax: 5, tags: [], instructions: "90/90 switches, pigeon, couch stretch. Breathe.", defaultSets: 1, defaultReps: 1 },
];

const ACHIEVEMENTS: (typeof achievements.$inferInsert)[] = [
  { id: "streak-7", name: "One Week Strong", description: "7 days in a row", icon: "flame", rule: { metric: "daily_session", threshold: 7 } },
  { id: "streak-14", name: "Two Week Grind", description: "14 days in a row", icon: "flame", rule: { metric: "daily_session", threshold: 14 }, treat: "Treat yourself to a local frozen yogurt" },
  { id: "wall-1000", name: "Wall Ball 1,000", description: "1,000 wall-ball reps logged", icon: "target", rule: { metric: "wall_ball_reps", threshold: 1000 } },
  { id: "fuel-10", name: "Fueled Up", description: "10 meals logged", icon: "zap", rule: { metric: "meals_logged", threshold: 10 } },
  { id: "ready-5", name: "Listening to Your Body", description: "5 readiness checks", icon: "heart", rule: { metric: "readiness_checks", threshold: 5 } },
];

const db = createCoreDb();
await db.insert(drills).values(DRILLS).onConflictDoNothing();
await db.insert(achievements).values(ACHIEVEMENTS).onConflictDoNothing();
console.log(`seeded ${DRILLS.length} drills, ${ACHIEVEMENTS.length} achievements`);
process.exit(0);
