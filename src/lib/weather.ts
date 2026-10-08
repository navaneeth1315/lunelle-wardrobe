import { useEffect, useState } from "react";

export type Weather = { temp: number; label: string; bucket: string };

const codeLabel = (c: number) =>
  c === 0 ? "Clear" : c <= 3 ? "Partly cloudy" : c <= 48 ? "Foggy" : c <= 67 || (c >= 80 && c <= 82) ? "Rain" : c <= 77 ? "Snow" : "Stormy";

export function bucketFor(temp: number, label: string) {
  if (label === "Rain" || label === "Stormy") return "Rainy";
  if (temp >= 28) return "Hot & sunny";
  if (temp >= 22) return "Warm";
  if (temp >= 15) return "Mild";
  if (temp >= 8) return "Cool";
  return "Cold";
}

/** Optional live weather. Never blocks the app; returns null if location is unavailable. */
export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "unavailable">("idle");
  useEffect(() => {
    const cached = sessionStorage.getItem("lunelle-weather");
    if (cached) {
      setWeather(JSON.parse(cached));
      setStatus("ok");
      return;
    }
    if (!("geolocation" in navigator)) return setStatus("unavailable");
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude.toFixed(2)}&longitude=${coords.longitude.toFixed(2)}&current=temperature_2m,weather_code`,
          );
          const j = await r.json();
          const temp = Math.round(j.current.temperature_2m);
          const label = codeLabel(j.current.weather_code);
          const w = { temp, label, bucket: bucketFor(temp, label) };
          sessionStorage.setItem("lunelle-weather", JSON.stringify(w));
          setWeather(w);
          setStatus("ok");
        } catch {
          setStatus("unavailable");
        }
      },
      () => setStatus("unavailable"),
      { maximumAge: 30 * 60_000, timeout: 8000 },
    );
  }, []);
  return { weather, status };
}
