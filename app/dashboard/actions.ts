"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RouteBar = { id: number; latitude: number | null; longitude: number | null };
type CustomRouteStation = { name: string; address: string; latitude: number; longitude: number };

function normalizePlace(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("sv-SE").trim();
}

async function geocodeCustomStations(stations: Array<{ name: string; address: string }>, city: string) {
  const located: CustomRouteStation[] = [];
  const normalizedCity = normalizePlace(city);
  for (let index = 0; index < stations.length; index++) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 1100));
    const station = stations[index];
    const fullAddress = `${station.address}, ${city}, Sverige`;
    const params = new URLSearchParams({
      q: fullAddress,
      format: "jsonv2",
      limit: "1",
      countrycodes: "se",
      addressdetails: "1",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      cache: "no-store",
      headers: {
        "Accept-Language": "sv,en;q=0.8",
        "User-Agent": "PubGolfWeb/1.0",
      },
    });
    if (!response.ok) throw new Error("Geokodningstjänsten svarar inte just nu");
    const matches = await response.json() as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
      address?: Record<string, string | undefined>;
    }>;
    const latitude = Number(matches[0]?.lat);
    const longitude = Number(matches[0]?.lon);
    const result = matches[0];
    const returnedPlaces = [
      result?.address?.city,
      result?.address?.town,
      result?.address?.village,
      result?.address?.municipality,
      ...(result?.display_name?.split(",") ?? []),
    ].filter((value): value is string => Boolean(value)).map(normalizePlace);
    const cityMatches = returnedPlaces.some((place) => place === normalizedCity || place.startsWith(`${normalizedCity} `));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !cityMatches) {
      throw new Error(`Adressen för ${station.name} kunde inte hittas i ${city}. Kontrollera gata, nummer och ort.`);
    }
    located.push({ ...station, address: `${station.address}, ${city}`, latitude, longitude });
  }
  return located;
}

function distanceBetween(a: RouteBar, b: RouteBar) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return Number.POSITIVE_INFINITY;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const startLatitude = toRadians(a.latitude);
  const endLatitude = toRadians(b.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function nearestRoute(start: RouteBar, candidates: RouteBar[]) {
  const route = [start];
  const remaining = [...candidates];
  while (remaining.length) {
    const current = route[route.length - 1];
    remaining.sort((a, b) => distanceBetween(current, a) - distanceBetween(current, b));
    route.push(remaining.shift()!);
  }
  return route;
}

function routeLength(route: RouteBar[]) {
  return route.slice(1).reduce((total, station, index) => total + distanceBetween(route[index], station), 0);
}

function optimizedRoute(start: RouteBar, candidates: RouteBar[]) {
  let best = nearestRoute(start, candidates);
  let improved = true;
  while (improved) {
    improved = false;
    let bestLength = routeLength(best);
    for (let from = 1; from < best.length - 1; from++) {
      for (let to = from + 1; to < best.length; to++) {
        const candidate = [...best.slice(0, from), ...best.slice(from, to + 1).reverse(), ...best.slice(to + 1)];
        const candidateLength = routeLength(candidate);
        if (candidateLength + 0.00001 < bestLength) {
          best = candidate;
          bestLength = candidateLength;
          improved = true;
        }
      }
    }
  }
  return best;
}

function smartRandomRoute(start: RouteBar, candidates: RouteBar[], holes: number) {
  const route = [start];
  const remaining = [...candidates];
  while (route.length < holes && remaining.length) {
    const current = route[route.length - 1];
    remaining.sort((a, b) => distanceBetween(current, a) - distanceBetween(current, b));
    const nearbyCount = Math.min(3, remaining.length);
    const selectedIndex = Math.floor(Math.random() * nearbyCount);
    route.push(remaining.splice(selectedIndex, 1)[0]);
  }
  return route;
}

export async function createGame(formData: FormData) {
  const supabase = await createClient();
  const city = String(formData.get("city") ?? "").trim();
  const requestedRouteMode = String(formData.get("routeMode") ?? "smart-random");
  const routeMode = requestedRouteMode === "planned" || requestedRouteMode === "custom" ? requestedRouteMode : "smart-random";
  const requestedHoles = Number(formData.get("holes") ?? 0);
  const startPub = Number(formData.get("startPub") ?? 0);
  const wheelEnabled = formData.get("wheelEnabled") === "on";
  const wheelCount = wheelEnabled ? Number(formData.get("wheelCount") ?? 0) : 0;
  const requestedWheelMode = String(formData.get("wheelMode") ?? "classic");
  const wheelMode = ["classic", "everyone", "random"].includes(requestedWheelMode) ? requestedWheelMode : "classic";

  if (routeMode === "custom") {
    const customCity = String(formData.get("customCity") ?? "").trim();
    let stations: Array<{ name: string; address: string }> = [];
    try {
      const parsed = JSON.parse(String(formData.get("customStations") ?? "[]"));
      if (Array.isArray(parsed)) {
        stations = parsed.map((station) => ({
          name: String(station?.name ?? "").trim(),
          address: String(station?.address ?? "").trim(),
        }));
      }
    } catch {
      redirect(`/dashboard?error=${encodeURIComponent("Custom-stationerna kunde inte läsas")}`);
    }
    if (customCity.length < 2 || customCity.length > 80) {
      redirect(`/dashboard?error=${encodeURIComponent("Ange vilken ort stationerna ligger i")}`);
    }
    if (stations.length < 2 || stations.length > 18 || stations.some((station) => !station.name || station.address.length < 3)) {
      redirect(`/dashboard?error=${encodeURIComponent("Ange namn och adress för 2–18 stationer")}`);
    }
    let locatedStations: CustomRouteStation[];
    try {
      locatedStations = await geocodeCustomStations(stations, customCity);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Adresserna kunde inte hittas";
      redirect(`/dashboard?error=${encodeURIComponent(message)}`);
    }
    const start = locatedStations[0];
    const ordered = optimizedRoute(
      { id: 0, latitude: start.latitude, longitude: start.longitude },
      locatedStations.slice(1).map((station, index) => ({ id: index + 1, latitude: station.latitude, longitude: station.longitude })),
    ).map((routeStation) => locatedStations[routeStation.id]);
    const safeWheelCount = Math.min(Math.max(wheelCount, 0), ordered.length);
    const { data, error } = await supabase.rpc("create_custom_game", {
      p_stations: ordered,
      p_wheel_count: safeWheelCount,
      p_wheel_mode: wheelMode,
      p_random_min: 1,
      p_random_max: 3,
    });
    if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
    const created = Array.isArray(data) ? data[0] : data;
    redirect(`/game/${created.code}`);
  }

  if (!city || !Number.isInteger(startPub)) {
    redirect(`/dashboard?error=${encodeURIComponent("Ogiltiga spelinställningar")}`);
  }

  const { data: bars, error: barsError } = await supabase.from("bars").select("id,latitude,longitude").eq("city", city);
  if (barsError) redirect(`/dashboard?error=${encodeURIComponent(barsError.message)}`);

  const cityBars = (bars ?? []).map((bar) => ({
    id: Number(bar.id),
    latitude: bar.latitude == null ? null : Number(bar.latitude),
    longitude: bar.longitude == null ? null : Number(bar.longitude),
  })) as RouteBar[];
  const ids = cityBars.map((bar) => bar.id);
  if (!ids.includes(startPub)) redirect(`/dashboard?error=${encodeURIComponent("Startpuben finns inte i vald stad")}`);
  const startBar = cityBars.find((bar) => bar.id === startPub)!;

  let route: RouteBar[];
  if (routeMode === "planned") {
    const selectedIds = Array.from(new Set(formData.getAll("selectedBars").map(Number).filter(Number.isInteger)));
    if (!selectedIds.includes(startPub)) selectedIds.unshift(startPub);
    const selectedBars = selectedIds.map((id) => cityBars.find((bar) => bar.id === id)).filter((bar): bar is RouteBar => Boolean(bar));
    if (selectedBars.length < 2) redirect(`/dashboard?error=${encodeURIComponent("Välj minst två pubar för rutten")}`);
    if (selectedBars.length > 18) redirect(`/dashboard?error=${encodeURIComponent("Välj högst 18 pubar för rutten")}`);
    route = nearestRoute(startBar, selectedBars.filter((bar) => bar.id !== startPub));
  } else {
    if (!Number.isInteger(requestedHoles) || requestedHoles < 1 || requestedHoles > ids.length) {
      redirect(`/dashboard?error=${encodeURIComponent(`Välj mellan 1 och ${ids.length} hål`)}`);
    }
    route = smartRandomRoute(startBar, cityBars.filter((bar) => bar.id !== startPub), requestedHoles);
  }

  const barIds = route.map((bar) => bar.id);
  const holes = barIds.length;

  const { data, error } = await supabase.rpc("create_game", {
    p_bar_ids: barIds,
    p_wheel_count: Math.min(Math.max(wheelCount, 0), holes),
    p_wheel_mode: wheelMode,
    p_random_min: 1,
    p_random_max: 3,
  });

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  const created = Array.isArray(data) ? data[0] : data;
  redirect(`/game/${created.code}`);
}

export async function joinGame(formData: FormData) {
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const { error } = await supabase.rpc("join_game", { p_code: code });
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  redirect(`/game/${code}`);
}
