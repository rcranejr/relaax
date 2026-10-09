/** Google Places adapter. Returns nearby restaurants; menus come from our cache or a conservative default list. */
export interface NearbyRestaurant { placeId: string; name: string; rating?: number; distanceM: number; lat: number; lng: number }

export async function nearbyRestaurants(lat: number, lng: number, radiusM = 2500): Promise<NearbyRestaurant[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.location" },
    body: JSON.stringify({ includedTypes: ["restaurant"], maxResultCount: 10, locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusM } } }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { places?: { id: string; displayName?: { text: string }; rating?: number; location: { latitude: number; longitude: number } }[] };
  return (json.places ?? []).map((p) => ({ placeId: p.id, name: p.displayName?.text ?? "Restaurant", rating: p.rating, lat: p.location.latitude, lng: p.location.longitude, distanceM: Math.round(haversine(lat, lng, p.location.latitude, p.location.longitude)) }));
}

function haversine(a: number, b: number, c: number, d: number) {
  const R = 6371e3, φ1 = (a * Math.PI) / 180, φ2 = (c * Math.PI) / 180, dφ = ((c - a) * Math.PI) / 180, dλ = ((d - b) * Math.PI) / 180;
  const x = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Fallback menu items by cuisine until the menu cache has real data. */
export const GENERIC_MENU = ["Grilled chicken bowl with rice and vegetables", "Turkey sandwich on whole grain with fruit", "Bean and cheese burrito", "Salmon with sweet potato", "Pasta with marinara and a side salad", "Greek yogurt parfait with granola"];
