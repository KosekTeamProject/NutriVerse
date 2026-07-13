"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, Square, RotateCcw, Footprints, Bike, Timer, Gauge, Zap,
  TriangleAlert, ShieldCheck, MapPin, Save, Check,
} from "lucide-react";
import {
  ACTIVITY, haversine, formatTime, paceMinPerKm, speedKmh, computeXp,
  type ActivityKind, type LatLng,
} from "@/lib/activity";

type Status = "idle" | "tracking" | "paused" | "finished";

function RoutePath({ points }: { points: LatLng[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-xs">Rute akan muncul saat kamu mulai bergerak</p>
      </div>
    );
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 10;
  const span = Math.max(1e-6, maxLat - minLat, maxLng - minLng);
  const norm = (p: LatLng) => ({
    x: pad + ((p.lng - minLng) / span) * (100 - 2 * pad),
    y: 100 - (pad + ((p.lat - minLat) / span) * (100 - 2 * pad)),
  });
  const d = points.map((p, i) => { const n = norm(p); return `${i === 0 ? "M" : "L"}${n.x.toFixed(1)},${n.y.toFixed(1)}`; }).join(" ");
  const start = norm(points[0]);
  const end = norm(points[points.length - 1]);
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <path d={d} fill="none" stroke="url(#routeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="var(--brand-bright)" />
          <stop offset="1" stopColor="var(--sky)" />
        </linearGradient>
      </defs>
      <circle cx={start.x} cy={start.y} r="2.6" fill="var(--brand)" />
      <circle cx={end.x} cy={end.y} r="3.2" fill="var(--sky)" stroke="white" strokeWidth="1.2" />
    </svg>
  );
}

export function ActivityTracker() {
  const [kind, setKind] = useState<ActivityKind>("run");
  const [status, setStatus] = useState<Status>("idle");
  const [useSim, setUseSim] = useState(false);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [rejected, setRejected] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const watchId = useRef<number | null>(null);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);
  const simId = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPoint = useRef<LatLng | null>(null);
  const lastTs = useRef<number | null>(null);
  const sim = useRef<{ lat: number; lng: number; heading: number } | null>(null);
  const kindRef = useRef<ActivityKind>(kind);
  kindRef.current = kind;

  useEffect(() => () => stopAll(), []);

  function stopAll() {
    if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timerId.current) { clearInterval(timerId.current); timerId.current = null; }
    if (simId.current) { clearInterval(simId.current); simId.current = null; }
  }

  function ingest(p: LatLng, ts: number) {
    const cfg = ACTIVITY[kindRef.current];
    const prev = lastPoint.current;
    if (prev && lastTs.current !== null) {
      const seg = haversine(prev, p);
      const dt = Math.max(0.001, (ts - lastTs.current) / 1000);
      const segKmh = seg / 1000 / (dt / 3600);
      if (seg > 1 && segKmh <= cfg.maxSpeedKmh) {
        setDistance((d) => d + seg);
        setRoute((r) => (r.length > 400 ? r : [...r, p]));
      } else if (segKmh > cfg.maxSpeedKmh) {
        setRejected((n) => n + 1);
      }
    } else {
      setRoute((r) => [...r, p]);
    }
    lastPoint.current = p;
    lastTs.current = ts;
  }

  function startTimer() {
    timerId.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function startReal(): boolean {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Perangkat ini tidak mendukung GPS/Geolocation.");
      return false;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => ingest({ lat: pos.coords.latitude, lng: pos.coords.longitude }, pos.timestamp),
      (err) => {
        if (err.code === err.PERMISSION_DENIED)
          setError("Izin lokasi ditolak. Aktifkan izin lokasi di browser untuk melacak aktivitas, atau gunakan Mode simulasi.");
        else setError("Gagal mendapatkan sinyal GPS. Coba di area terbuka, atau gunakan Mode simulasi.");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
    return true;
  }

  function startSim() {
    if (!sim.current) sim.current = { lat: -6.9147, lng: 107.6098, heading: Math.random() * Math.PI * 2 };
    const mps = kindRef.current === "run" ? 2.8 : 6.0;
    simId.current = setInterval(() => {
      const s = sim.current!;
      s.heading += (Math.random() - 0.5) * 0.4;
      s.lat += (mps * Math.cos(s.heading)) / 111320;
      s.lng += (mps * Math.sin(s.heading)) / (111320 * Math.cos((s.lat * Math.PI) / 180));
      ingest({ lat: s.lat, lng: s.lng }, Date.now());
    }, 1000);
  }

  function begin() {
    setError(null); setSaved(false);
    setDistance(0); setElapsed(0); setRoute([]); setRejected(0);
    lastPoint.current = null; lastTs.current = null; sim.current = null;
    if (useSim) startSim();
    else if (!startReal()) return;
    startTimer();
    setStatus("tracking");
  }

  function pause() { stopAll(); setStatus("paused"); }

  function resume() {
    lastPoint.current = null; lastTs.current = null;
    if (useSim) startSim(); else startReal();
    startTimer();
    setStatus("tracking");
  }

  function finish() { stopAll(); setStatus("finished"); }

  function reset() {
    stopAll();
    setStatus("idle"); setDistance(0); setElapsed(0); setRoute([]); setRejected(0);
    setError(null); setSaved(false);
    lastPoint.current = null; lastTs.current = null; sim.current = null;
  }

  const cfg = ACTIVITY[kind];
  const suspicious = rejected >= 3;
  const km = distance / 1000;
  const xp = suspicious ? 0 : computeXp(distance, kind);
  const spd = speedKmh(distance, elapsed);
  const active = status === "tracking" || status === "paused";

  return (
    <div className="card card-pad">
      {/* activity type */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-secondary p-1">
          {(["run", "bike"] as ActivityKind[]).map((k) => {
            const Icon = k === "run" ? Footprints : Bike;
            const on = kind === k;
            return (
              <button
                key={k}
                onClick={() => !active && setKind(k)}
                disabled={active}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed ${
                  on ? "bg-card text-brand shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {ACTIVITY[k].label}
              </button>
            );
          })}
        </div>

        {status === "idle" && (
          <button
            onClick={() => setUseSim((v) => !v)}
            className={`pill transition ${useSim ? "bg-sky/10 text-sky" : "bg-secondary text-muted-foreground"}`}
          >
            <span className={`h-2 w-2 rounded-full ${useSim ? "bg-sky" : "bg-muted-foreground/50"}`} />
            Mode simulasi
          </button>
        )}
      </div>

      {/* big stat display */}
      <div className="mt-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">Jarak tempuh</p>
        <p className="stat-num mt-1 text-6xl leading-none">
          {km.toFixed(2)}<span className="ml-2 text-2xl text-muted-foreground">km</span>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-secondary p-3 text-center">
          <Timer className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="stat-num mt-1.5 text-lg">{formatTime(elapsed)}</p>
          <p className="text-[11px] text-muted-foreground">Waktu</p>
        </div>
        <div className="rounded-2xl bg-secondary p-3 text-center">
          <Gauge className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="stat-num mt-1.5 text-lg">{paceMinPerKm(distance, elapsed)}</p>
          <p className="text-[11px] text-muted-foreground">Pace /km</p>
        </div>
        <div className="rounded-2xl bg-secondary p-3 text-center">
          <Bike className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="stat-num mt-1.5 text-lg">{spd.toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground">km/jam</p>
        </div>
        <div className="rounded-2xl bg-amber/15 p-3 text-center">
          <Zap className="mx-auto h-4 w-4 text-amber" />
          <p className="stat-num mt-1.5 text-lg text-amber">{xp}</p>
          <p className="text-[11px] text-muted-foreground">XP {suspicious ? "(ditahan)" : "estimasi"}</p>
        </div>
      </div>

      {/* route + validity */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
        <div className="h-40 rounded-2xl border border-line bg-secondary/50 p-2">
          <RoutePath points={route} />
        </div>
        <div className="flex flex-col justify-center gap-2 rounded-2xl border border-line p-4 sm:w-52">
          {suspicious ? (
            <div className="flex items-start gap-2 text-amber">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Perlu ditinjau</p>
                <p className="text-xs text-muted-foreground">{rejected} segmen berkecepatan tidak wajar terdeteksi.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-brand">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Tervalidasi</p>
                <p className="text-xs text-muted-foreground">Kecepatan wajar untuk {cfg.label.toLowerCase()}.</p>
              </div>
            </div>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Anti-cheat: kecepatan di atas {cfg.maxSpeedKmh} km/jam dianggap kendaraan dan tidak dihitung sebagai XP.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {status === "idle" && (
          <button onClick={begin} className="btn btn-primary btn-lg"><Play className="h-5 w-5" /> Mulai</button>
        )}
        {status === "tracking" && (
          <>
            <button onClick={pause} className="btn btn-outline btn-lg"><Pause className="h-5 w-5" /> Jeda</button>
            <button onClick={finish} className="btn btn-primary btn-lg"><Square className="h-5 w-5" /> Selesai</button>
          </>
        )}
        {status === "paused" && (
          <>
            <button onClick={resume} className="btn btn-primary btn-lg"><Play className="h-5 w-5" /> Lanjut</button>
            <button onClick={finish} className="btn btn-outline btn-lg"><Square className="h-5 w-5" /> Selesai</button>
          </>
        )}
        {status === "finished" && (
          <>
            {saved ? (
              <span className="btn bg-brand-soft text-brand"><Check className="h-5 w-5" /> Tersimpan (demo)</span>
            ) : (
              <button onClick={() => setSaved(true)} className="btn btn-primary btn-lg" disabled={suspicious}>
                <Save className="h-5 w-5" /> {suspicious ? "Tidak bisa disimpan" : `Simpan (+${xp} XP)`}
              </button>
            )}
            <button onClick={reset} className="btn btn-ghost btn-lg"><RotateCcw className="h-5 w-5" /> Aktivitas baru</button>
          </>
        )}
      </div>

      {status === "finished" && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {suspicious
            ? "Aktivitas ini ditandai karena pola kecepatan tidak wajar, sehingga XP tidak diberikan."
            : `Kerja bagus. Kamu menempuh ${km.toFixed(2)} km dan memperoleh ${xp} XP.`}
        </p>
      )}
    </div>
  );
}
