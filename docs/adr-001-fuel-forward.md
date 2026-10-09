# ADR 001: Fuel-forward nutrition, not energy balancing

Status: accepted (pending Rick's sign-off, see blueprint Open decisions)

The brief asked for "dynamic energy balancing": compute burn, compare to intake, and prescribe conditioning to close a surplus. For athletes 8-18 this is an exercise-to-earn-food loop. We replaced it with fuel-forward planning: the training calendar and today's readiness produce a `fuelProfile`; meal options are generated to match it. No calorie or macro fields exist in the minor-facing schema (`MealOption`); `MealOptionAdult` adds them for 18-year-olds who opt in. The model is instructed never to mention calories, weight or "burning off"; the serializer strips any numeric that slips through.
