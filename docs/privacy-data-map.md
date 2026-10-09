# Privacy data map (Phase 1)

| Data | Where | Who can see it | Why we hold it |
| --- | --- | --- | --- |
| Date of birth | core.users | Nobody in-app; drives age band only | COPPA gate, guardrail age bands |
| Email | core.users (adults only; null for minors) | Account owner | Sign-in, parent notifications |
| Lacrosse profile (name, position, grad year, cuisines) | core.athlete_profiles | Athlete, verified parent, coach with grant | Planning and meal matching |
| Readiness checks | health.readiness_checks | Athlete (own), parent | Load ceiling |
| Mood logs | health.mood_logs (free text encrypted) | Athlete (own), parent | Coach context, escalation |
| Coach transcripts | health.coach_messages (encrypted) | Athlete (own), parent; human reviewer when flagged | Safety review |
| Body metrics | health.body_metrics | Parent; athlete under 18 sees trend only | Optional, parent-entered |
| Preference signals | core.ai_memory | Athlete | Personalization |
| What left our account to the model | PlanningContext / MealOptionsInput (no PII), scrubbed coach text | n/a | Plan generation |

Every read of the health schema writes a row to health.access_log, visible to parents with the health_view grant.
