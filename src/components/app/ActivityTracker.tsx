"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Square, RotateCcw, Footprints, Bike, Timer, Gauge, Zap,
  TriangleAlert, ShieldCheck, Save, Check, Navigation, Radio,
  Car, ClockAlert, MessageSquareText,
  Download, ChevronRight,
} from "lucide-react";
import {
  ACTIVITY, haversine, formatTime, paceMinPerKm, speedKmh, computeXp,
  applyDailyXpPolicy, XP_SAFETY_POLICY, minimumMovementMetersForAccuracy,
  type ActivityKind, type LatLng,
} from "@/lib/activity";
import { downloadActivityPng } from "@/features/activity/export-activity-png";
import { LiveRouteMap } from "@/features/activity/components/LiveRouteMap";
import { notifyDataChanged } from "@/lib/data-sync";
import { useProgressData } from "@/providers/ProgressDataProvider";

type Status = "idle" | "tracking" | "paused" | "finished";
type TelemetryPoint = {
  sequenceNumber: number;
  segmentNumber: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
};

const MAX_SESSION_SECONDS = 4 * 60 * 60;
const MAX_ROUTE_POINTS = 20_000;
const TELEMETRY_BATCH_SIZE = 100;
const TELEMETRY_SYNC_INTERVAL_MS = 5_000;
const SESSION_HEARTBEAT_INTERVAL_MS = 10_000;
const CLIENT_SESSION_STORAGE_KEY = "nutriverse:active-activity-client-session";

export function ActivityTracker() {
  const router = useRouter();
  const { overview } = useProgressData();
  const [kind, setKind] = useState<ActivityKind>("run");
  const [status, setStatus] = useState<Status>("idle");
  const [useSim, setUseSim] = useState(false);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [routeSegments, setRouteSegments] = useState<LatLng[][]>([]);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [rejected, setRejected] = useState(0);
  const [locationJumps, setLocationJumps] = useState(0);
  const [gpsQualityRejected, setGpsQualityRejected] = useState(0);
  const [sampleGaps, setSampleGaps] = useState(0);
  const [timestampIssues, setTimestampIssues] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverAwardXp, setServerAwardXp] = useState<number | null>(null);
  const [serverVerificationStatus, setServerVerificationStatus] = useState<string | null>(null);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [pngDownloaded, setPngDownloaded] = useState(false);

  const watchId = useRef<number | null>(null);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);
  const simId = useRef<ReturnType<typeof setInterval> | null>(null);
  const telemetrySyncId = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionHeartbeatId = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPoint = useRef<LatLng | null>(null);
  const lastTs = useRef<number | null>(null);
  const sim = useRef<{ lat: number; lng: number; heading: number } | null>(null);
  const telemetry = useRef<TelemetryPoint[]>([]);
  const pendingTelemetry = useRef<TelemetryPoint[]>([]);
  const telemetryFlushPromise = useRef<Promise<void> | null>(null);
  const nextSequenceNumber = useRef(0);
  const segmentNumber = useRef(0);
  const startNewRouteSegment = useRef(true);
  const speedWindow = useRef<number[]>([]);
  const sessionId = useRef<string | null>(null);
  const clientSessionId = useRef<string | null>(null);
  const sessionStartedAt = useRef<Date | null>(null);
  const sessionEndedAt = useRef<Date | null>(null);
  const pauseStartedAt = useRef<number | null>(null);
  const totalPausedMs = useRef(0);
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
    if (telemetrySyncId.current) {
      clearInterval(telemetrySyncId.current);
      telemetrySyncId.current = null;
    }
    if (sessionHeartbeatId.current) {
      clearInterval(sessionHeartbeatId.current);
      sessionHeartbeatId.current = null;
    }
  }

  function activeElapsedSeconds(now = Date.now()) {
    if (!sessionStartedAt.current) return 0;
    const activePauseMs =
      pauseStartedAt.current === null ? 0 : Math.max(0, now - pauseStartedAt.current);
    return Math.max(
      0,
      Math.floor(
        (now - sessionStartedAt.current.getTime() - totalPausedMs.current - activePauseMs) /
          1000,
      ),
    );
  }

  function appendRoutePoint(point: LatLng) {
    setRoute((current) =>
      current.length >= MAX_ROUTE_POINTS ? current : [...current, point],
    );
    setRouteSegments((segments) => {
      if (startNewRouteSegment.current || segments.length === 0) {
        startNewRouteSegment.current = false;
        return [...segments, [point]];
      }
      const lastSegment = segments.at(-1) ?? [];
      if (
        segments.reduce((total, segment) => total + segment.length, 0) >=
        MAX_ROUTE_POINTS
      ) {
        return segments;
      }
      return [...segments.slice(0, -1), [...lastSegment, point]];
    });
  }

  async function sendTelemetryBatch(batch: TelemetryPoint[]) {
    if (!sessionId.current || batch.length === 0) return;
    const response = await fetch(
      `/api/activities/${sessionId.current}/telemetry`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ samples: batch }),
        keepalive: batch.length <= TELEMETRY_BATCH_SIZE,
      },
    );
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      throw new Error(result?.error || "Sinkronisasi telemetry gagal.");
    }
  }

  function flushTelemetry(drain = false): Promise<void> {
    if (telemetryFlushPromise.current) {
      return drain
        ? telemetryFlushPromise.current.then(() => flushTelemetry(true))
        : telemetryFlushPromise.current;
    }
    if (!sessionId.current || pendingTelemetry.current.length === 0) {
      return Promise.resolve();
    }

    const task = (async () => {
      do {
        const batch = pendingTelemetry.current.splice(0, TELEMETRY_BATCH_SIZE);
        try {
          await sendTelemetryBatch(batch);
          setError((current) =>
            current?.startsWith("Sinkronisasi telemetry") ? null : current,
          );
        } catch (syncError) {
          pendingTelemetry.current = [...batch, ...pendingTelemetry.current];
          const message =
            syncError instanceof Error
              ? syncError.message
              : "Sinkronisasi telemetry gagal.";
          setError(`${message} Data tetap disimpan di perangkat dan akan dicoba kembali.`);
          throw syncError;
        }
      } while (drain && pendingTelemetry.current.length > 0);
    })();

    telemetryFlushPromise.current = task.finally(() => {
      telemetryFlushPromise.current = null;
    });
    return telemetryFlushPromise.current;
  }

  function queueTelemetry(point: TelemetryPoint) {
    telemetry.current.push(point);
    pendingTelemetry.current.push(point);
    if (pendingTelemetry.current.length >= 10) {
      void flushTelemetry().catch(() => undefined);
    }
  }

  function ingest(
    point: LatLng,
    timestamp: number,
    accuracy?: number,
    reportedSpeed?: number | null,
  ) {
    if (
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng) ||
      point.lat < -90 ||
      point.lat > 90 ||
      point.lng < -180 ||
      point.lng > 180
    ) {
      setGpsQualityRejected((count) => count + 1);
      return;
    }

    const previous = lastPoint.current;
    const previousTimestamp = lastTs.current;
    const gapSeconds =
      previousTimestamp === null ? 0 : (timestamp - previousTimestamp) / 1000;
    if (previous && gapSeconds > 120) {
      setSampleGaps((count) => count + 1);
      segmentNumber.current += 1;
      startNewRouteSegment.current = true;
      lastPoint.current = null;
      lastTs.current = null;
    }

    const telemetryPoint: TelemetryPoint = {
      sequenceNumber: nextSequenceNumber.current,
      segmentNumber: segmentNumber.current,
      timestamp: new Date(timestamp).toISOString(),
      latitude: point.lat,
      longitude: point.lng,
      accuracy: typeof accuracy === "number" && Number.isFinite(accuracy) ? accuracy : null,
      speed:
        typeof reportedSpeed === "number" && Number.isFinite(reportedSpeed)
          ? reportedSpeed
          : null,
    };
    nextSequenceNumber.current += 1;
    queueTelemetry(telemetryPoint);
    setCurrentLocation(point);

    if (typeof accuracy === "number" && (!Number.isFinite(accuracy) || accuracy > 35)) {
      setGpsQualityRejected((count) => count + 1);
      return;
    }

    const acceptedPrevious = lastPoint.current;
    const acceptedPreviousTimestamp = lastTs.current;
    if (!acceptedPrevious || acceptedPreviousTimestamp === null) {
      appendRoutePoint(point);
      lastPoint.current = point;
      lastTs.current = timestamp;
      return;
    }

    const deltaSeconds = (timestamp - acceptedPreviousTimestamp) / 1000;
    if (deltaSeconds <= 0) {
      setTimestampIssues((count) => count + 1);
      return;
    }

    const segmentDistance = haversine(acceptedPrevious, point);
    const calculatedSpeedKmh = (segmentDistance / deltaSeconds) * 3.6;
    // Device-reported speed is frequently absent or noisy in browser GPS.
    // Coordinate-derived speed is deterministic and matches server verification.
    const evaluatedSpeedKmh = calculatedSpeedKmh;
    const minimumMovementMeters = minimumMovementMetersForAccuracy(accuracy);
    const configuration = ACTIVITY[kindRef.current];

    if (deltaSeconds < 2 && evaluatedSpeedKmh > 150) {
      setLocationJumps((count) => count + 1);
      return;
    }
    if (evaluatedSpeedKmh > configuration.maxSpeedKmh) {
      setRejected((count) => count + 1);
      return;
    }
    if (segmentDistance < minimumMovementMeters) {
      setLiveSpeed(0);
      return;
    }

    setDistance((current) => current + segmentDistance);
    appendRoutePoint(point);
    speedWindow.current = [...speedWindow.current.slice(-4), calculatedSpeedKmh];
    setLiveSpeed(
      speedWindow.current.reduce((total, value) => total + value, 0) /
        speedWindow.current.length,
    );
    lastPoint.current = point;
    lastTs.current = timestamp;
  }

  function startTimer() {
    setElapsed(activeElapsedSeconds());
    timerId.current = setInterval(() => {
      setElapsed(activeElapsedSeconds());
    }, 500);
  }

  function startTelemetrySync() {
    telemetrySyncId.current = setInterval(() => {
      void flushTelemetry().catch(() => undefined);
    }, TELEMETRY_SYNC_INTERVAL_MS);
  }

  function startSessionHeartbeat() {
    if (!sessionId.current) return;
    if (sessionHeartbeatId.current) clearInterval(sessionHeartbeatId.current);
    const sendHeartbeat = () => {
      if (!sessionId.current) return;
      void fetch(`/api/activities/${sessionId.current}/heartbeat`, {
        method: "POST",
        keepalive: true,
      }).catch(() => undefined);
    };
    sendHeartbeat();
    sessionHeartbeatId.current = setInterval(
      sendHeartbeat,
      SESSION_HEARTBEAT_INTERVAL_MS,
    );
  }

  function clearStoredClientSession() {
    clientSessionId.current = null;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(CLIENT_SESSION_STORAGE_KEY);
    }
  }

  function startReal(): boolean {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Perangkat ini tidak mendukung GPS/Geolocation.");
      return false;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (position) =>
        ingest(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          position.timestamp,
          position.coords.accuracy,
          position.coords.speed,
        ),
      (locationError) => {
        stopAll();
        startSessionHeartbeat();
        pauseStartedAt.current = Date.now();
        setStatus("paused");
        if (locationError.code === locationError.PERMISSION_DENIED) {
          setError(
            "Izin lokasi ditolak. Aktifkan izin lokasi di browser, lalu lanjutkan kembali.",
          );
        } else {
          setError("Sinyal GPS belum tersedia. Coba di area terbuka lalu lanjutkan kembali.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
    return true;
  }

  function startSim() {
    if (!sim.current) {
      sim.current = {
        lat: -6.9147,
        lng: 107.6098,
        heading: Math.random() * Math.PI * 2,
      };
      ingest({ lat: sim.current.lat, lng: sim.current.lng }, Date.now(), 5, 0);
    }
    const metersPerSecond =
      kindRef.current === "walk" ? 1.4 : kindRef.current === "run" ? 2.8 : 6;
    simId.current = setInterval(() => {
      const current = sim.current!;
      current.heading += (Math.random() - 0.5) * 0.25;
      current.lat += (metersPerSecond * Math.cos(current.heading)) / 111_320;
      current.lng +=
        (metersPerSecond * Math.sin(current.heading)) /
        (111_320 * Math.cos((current.lat * Math.PI) / 180));
      ingest(
        { lat: current.lat, lng: current.lng },
        Date.now(),
        5,
        metersPerSecond,
      );
    }, 1_000);
  }

  async function begin() {
    if (starting) return;
    if (
      !useSim &&
      (typeof navigator === "undefined" || !("geolocation" in navigator))
    ) {
      setError("Perangkat ini tidak mendukung GPS/Geolocation.");
      return;
    }

    setStarting(true);
    setError(null);
    setSaved(false);
    setServerVerificationStatus(null);
    setReviewRequested(false);
    setDistance(0);
    setElapsed(0);
    setLiveSpeed(0);
    setRoute([]);
    setRouteSegments([]);
    setCurrentLocation(null);
    setRejected(0);
    setLocationJumps(0);
    setGpsQualityRejected(0);
    setSampleGaps(0);
    setTimestampIssues(0);
    lastPoint.current = null;
    lastTs.current = null;
    sim.current = null;
    telemetry.current = [];
    pendingTelemetry.current = [];
    nextSequenceNumber.current = 0;
    segmentNumber.current = 0;
    startNewRouteSegment.current = true;
    speedWindow.current = [];
    totalPausedMs.current = 0;
    pauseStartedAt.current = null;
    sessionEndedAt.current = null;
    sessionStartedAt.current = new Date();

    try {
      const storedClientSessionId =
        typeof window === "undefined"
          ? null
          : window.sessionStorage.getItem(CLIENT_SESSION_STORAGE_KEY);
      const requestedClientSessionId =
        storedClientSessionId || crypto.randomUUID();
      clientSessionId.current = requestedClientSessionId;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          CLIENT_SESSION_STORAGE_KEY,
          requestedClientSessionId,
        );
      }
      const response = await fetch("/api/activities/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activityType:
            kind === "walk" ? "WALK" : kind === "run" ? "RUN" : "CYCLED",
          startTime: sessionStartedAt.current.toISOString(),
          isSimulated: useSim,
          clientSessionId: requestedClientSessionId,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        resumed?: boolean;
        session?: {
          id: string;
          clientSessionId?: string | null;
          activityType?: "WALK" | "RUN" | "CYCLED";
          startTime?: string;
          isSimulated?: boolean;
        };
        resume?: {
          nextSequenceNumber?: number;
          nextSegmentNumber?: number;
          inactiveDurationSeconds?: number;
        };
      } | null;
      if (!response.ok || !result?.session) {
        throw new Error(result?.error || "Aktivitas tidak dapat dibuat.");
      }
      sessionId.current = result.session.id;
      clientSessionId.current =
        result.session.clientSessionId || requestedClientSessionId;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          CLIENT_SESSION_STORAGE_KEY,
          clientSessionId.current,
        );
      }
      if (result.session.startTime) {
        const storedStartTime = new Date(result.session.startTime);
        if (!Number.isNaN(storedStartTime.getTime())) {
          sessionStartedAt.current = storedStartTime;
        }
      }
      if (result.resumed) {
        nextSequenceNumber.current = Math.max(
          0,
          result.resume?.nextSequenceNumber ?? 0,
        );
        segmentNumber.current = Math.max(
          0,
          result.resume?.nextSegmentNumber ?? 0,
        );
        totalPausedMs.current =
          Math.max(0, result.resume?.inactiveDurationSeconds ?? 0) * 1_000;
        startNewRouteSegment.current = true;
        const resumedKind =
          result.session.activityType === "WALK"
            ? "walk"
            : result.session.activityType === "CYCLED"
              ? "bike"
              : "run";
        kindRef.current = resumedKind;
        setKind(resumedKind);
      }
      const sessionUsesSimulation =
        result.resumed && typeof result.session.isSimulated === "boolean"
          ? result.session.isSimulated
          : useSim;
      if (result.resumed) setUseSim(sessionUsesSimulation);

      if (sessionUsesSimulation) startSim();
      else if (!startReal()) throw new Error("GPS tidak dapat dimulai.");
      startTimer();
      startTelemetrySync();
      startSessionHeartbeat();
      setStatus("tracking");
    } catch (startError) {
      sessionId.current = null;
      sessionStartedAt.current = null;
      setStatus("idle");
      setError(
        startError instanceof Error
          ? startError.message
          : "Aktivitas tidak dapat dimulai.",
      );
    } finally {
      setStarting(false);
    }
  }

  function pause() {
    if (status !== "tracking") return;
    stopAll();
    startSessionHeartbeat();
    pauseStartedAt.current = Date.now();
    setLiveSpeed(0);
    setStatus("paused");
    void flushTelemetry().catch(() => undefined);
  }

  function resume() {
    if (status !== "paused") return;
    if (pauseStartedAt.current !== null) {
      totalPausedMs.current += Date.now() - pauseStartedAt.current;
      pauseStartedAt.current = null;
    }
    segmentNumber.current += 1;
    startNewRouteSegment.current = true;
    lastPoint.current = null;
    lastTs.current = null;
    speedWindow.current = [];
    setError(null);
    if (useSim) startSim();
    else if (!startReal()) return;
    startTimer();
    startTelemetrySync();
    startSessionHeartbeat();
    setStatus("tracking");
  }

  function finish() {
    if (status !== "tracking" && status !== "paused") return;
    if (pauseStartedAt.current !== null) {
      totalPausedMs.current += Date.now() - pauseStartedAt.current;
      pauseStartedAt.current = null;
    }
    sessionEndedAt.current = new Date();
    setElapsed(activeElapsedSeconds(sessionEndedAt.current.getTime()));
    setLiveSpeed(0);
    stopAll();
    setStatus("finished");
    void flushTelemetry().catch(() => undefined);
  }

  async function cancelPendingSession() {
    if (!sessionId.current || saved) return;
    await fetch(`/api/activities/${sessionId.current}`, {
      method: "DELETE",
      keepalive: true,
    }).catch(() => undefined);
  }

  function reset() {
    stopAll();
    void cancelPendingSession();
    clearStoredClientSession();
    setStatus("idle");
    setDistance(0);
    setElapsed(0);
    setLiveSpeed(0);
    setRoute([]);
    setRouteSegments([]);
    setCurrentLocation(null);
    setRejected(0);
    setLocationJumps(0);
    setGpsQualityRejected(0);
    setSampleGaps(0);
    setTimestampIssues(0);
    setError(null);
    setSaved(false);
    setReviewRequested(false);
    setDownloadingPng(false);
    setPngDownloaded(false);
    setSaving(false);
    setServerAwardXp(null);
    setServerVerificationStatus(null);
    lastPoint.current = null;
    lastTs.current = null;
    sim.current = null;
    telemetry.current = [];
    pendingTelemetry.current = [];
    sessionId.current = null;
    sessionStartedAt.current = null;
    sessionEndedAt.current = null;
    pauseStartedAt.current = null;
    totalPausedMs.current = 0;
  }

  const durationTooLong = elapsed > MAX_SESSION_SECONDS;
  const serverRejected =
    serverVerificationStatus !== null &&
    serverVerificationStatus !== "VERIFIED";
  const suspicious =
    rejected >= 3 ||
    locationJumps > 0 ||
    gpsQualityRejected >= 5 ||
    sampleGaps >= 2 ||
    timestampIssues > 0 ||
    durationTooLong ||
    serverRejected;
  const km = distance / 1000;
  const baseXp = computeXp(distance, kind);
  const xpEarnedToday = overview?.economy.xpToday ?? 0;
  const xpPolicy = applyDailyXpPolicy(baseXp, xpEarnedToday);
  const provisionalXp = suspicious ? 0 : xpPolicy.awarded;
  const xp = serverAwardXp ?? provisionalXp;
  const averageSpeed = speedKmh(distance, elapsed);
  const displayedSpeed = status === "tracking" ? liveSpeed : averageSpeed;
  const active = starting || status === "tracking" || status === "paused";
  const integrityChecks = [
    { label: "Pace & pola kendaraan", icon: Car, issue: rejected >= 3, detail: `${rejected} segmen ditahan` },
    { label: "Lonjakan koordinat", icon: Navigation, issue: locationJumps > 0, detail: `${locationJumps} anomali` },
    { label: "Kualitas GPS", icon: Radio, issue: gpsQualityRejected >= 5, detail: `${gpsQualityRejected} sampel ditolak` },
    { label: "Kontinuitas data", icon: ClockAlert, issue: sampleGaps >= 2 || timestampIssues > 0, detail: `${sampleGaps + timestampIssues} masalah` },
  ];

  async function handleDownloadPng() {
    if (route.length < 2 || downloadingPng) return;
    setDownloadingPng(true);
    setError(null);
    try {
      await downloadActivityPng({
        kind,
        route,
        distanceKm: km,
        elapsedLabel: formatTime(elapsed),
        paceLabel: paceMinPerKm(distance, elapsed),
        speedKmh: averageSpeed,
        estimatedXp: xp,
        isSimulation: useSim,
        needsReview: suspicious,
      });
      setPngDownloaded(true);
      window.setTimeout(() => setPngDownloaded(false), 2_000);
    } catch {
      setError("Gagal membuat gambar aktivitas. Coba ulangi dari browser terbaru.");
    } finally {
      setDownloadingPng(false);
    }
  }

  async function saveActivity() {
    if (
      saving ||
      saved ||
      !sessionId.current ||
      !sessionStartedAt.current ||
      !sessionEndedAt.current
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await flushTelemetry(true);
      const finishResponse = await fetch(
        `/api/activities/${sessionId.current}/finish`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endTime: sessionEndedAt.current.toISOString(),
            pausedDurationSeconds: Math.min(
              Math.ceil(totalPausedMs.current / 1_000),
              Math.max(
                0,
                Math.floor(
                  (sessionEndedAt.current.getTime() -
                    sessionStartedAt.current.getTime()) /
                    1_000,
                ),
              ),
            ),
          }),
        },
      );
      const finishResult = (await finishResponse.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        verification?: { verificationStatus?: string };
        reward?: { xpGrant?: { amount?: number } } | null;
      } | null;
      if (!finishResponse.ok || !finishResult?.success) {
        throw new Error(finishResult?.error || "Aktivitas gagal diselesaikan.");
      }
      setServerVerificationStatus(
        finishResult.verification?.verificationStatus ?? "NOT_VERIFIED",
      );
      setServerAwardXp(finishResult.reward?.xpGrant?.amount ?? 0);
      setSaved(true);
      clearStoredClientSession();
      notifyDataChanged();
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Aktivitas belum dapat disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6">
      {/* LEFT COLUMN: Map, Mode, Controls */}
      <div className="contents lg:block lg:col-span-7 xl:col-span-8 lg:space-y-6">
        
        {/* 1. Map (Hero) -> order-3 di mobile */}
        <div className="order-3 lg:order-none card card-pad p-3 sm:p-4 border-line bg-card">
          <div className="chart-surface chart-surface-sky h-48 sm:h-64 rounded-xl border border-line p-2">
            <LiveRouteMap
              segments={routeSegments}
              currentLocation={currentLocation}
              isTracking={status === "tracking"}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
            {suspicious ? (
              <span className="flex items-center gap-1.5 text-amber"><TriangleAlert className="h-4 w-4" /> Perlu ditinjau</span>
            ) : (
              <span className="flex items-center gap-1.5 text-brand"><ShieldCheck className="h-4 w-4" /> Rute tervalidasi</span>
            )}
            <span className="pill bg-secondary text-[9px] uppercase font-bold text-muted-foreground">PETA LANGSUNG</span>
          </div>
        </div>

        {/* 2. Mode Aktivitas -> order-1 di mobile */}
        <div className="order-1 lg:order-none card card-pad p-4 border-line bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-secondary p-1">
            {(["walk", "run", "bike"] as ActivityKind[]).map((k) => {
              const Icon = k === "walk" ? Footprints : k === "run" ? Footprints : Bike;
              const on = kind === k;
              return (
                <button
                  key={k}
                  onClick={() => !active && setKind(k)}
                  disabled={active}
                  className={`inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed ${
                    on ? "bg-card text-brand shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{ACTIVITY[k].label}</span>
                </button>
              );
            })}
          </div>

          {status === "idle" && (
            <button
              onClick={() => setUseSim((v) => !v)}
              disabled={starting}
              className={`pill transition disabled:cursor-wait disabled:opacity-60 ${useSim ? "bg-sky/10 text-sky" : "bg-secondary text-muted-foreground"}`}
            >
              <span className={`h-2 w-2 rounded-full ${useSim ? "bg-sky" : "bg-muted-foreground/50"}`} />
              Mode simulasi
            </button>
          )}
        </div>

        {/* error message -> menyertai mode */}
        {error && (
          <div className="order-2 lg:order-none flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* 3. Controls / CTA -> order-4 di mobile */}
        <div className="order-4 lg:order-none card card-pad p-4 sm:p-6 border-line bg-card flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {status === "idle" && (
            <button
              onClick={begin}
              disabled={starting}
              className="btn btn-primary rounded-full w-full sm:w-auto px-8 py-3.5 text-base sm:text-lg font-bold shadow-soft transition-all hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 disabled:cursor-wait disabled:opacity-60"
            >
              <Play className="h-5 w-5 mr-1" /> {starting ? "Menyiapkan GPS..." : "Mulai Aktivitas"}
            </button>
          )}
          {status === "tracking" && (
            <>
              <button onClick={pause} className="btn btn-outline btn-lg flex-1 sm:flex-none"><Pause className="h-5 w-5" /> Jeda</button>
              <button onClick={finish} className="btn btn-primary btn-lg flex-1 sm:flex-none"><Square className="h-5 w-5" /> Selesai</button>
            </>
          )}
          {status === "paused" && (
            <>
              <button onClick={resume} className="btn btn-primary btn-lg flex-1 sm:flex-none"><Play className="h-5 w-5" /> Lanjut</button>
              <button onClick={finish} className="btn btn-outline btn-lg flex-1 sm:flex-none"><Square className="h-5 w-5" /> Selesai</button>
            </>
          )}
          {status === "finished" && (
            <>
              {saved ? (
                <span className="btn bg-brand-soft text-brand w-full sm:w-auto"><Check className="h-5 w-5" /> {suspicious ? "Riwayat pribadi tersimpan" : "Tersimpan di database"}</span>
              ) : (
                <button onClick={saveActivity} disabled={saving} className="btn btn-primary btn-lg w-full sm:w-auto disabled:opacity-60">
                  <Save className="h-5 w-5" /> {saving ? "Mengirim..." : suspicious ? "Simpan sebagai riwayat pribadi" : `Simpan (+${xp} XP)`}
                </button>
              )}
              {suspicious && (reviewRequested ? (
                <span className="btn bg-amber/15 text-amber w-full sm:w-auto"><Check className="h-5 w-5" /> Peninjauan diminta</span>
              ) : (
                <button onClick={() => setReviewRequested(true)} className="btn btn-outline btn-lg w-full sm:w-auto">
                  <MessageSquareText className="h-5 w-5" /> Ajukan peninjauan
                </button>
              ))}
              <div className="flex w-full sm:w-auto gap-3 mt-2 sm:mt-0">
                <button
                  onClick={handleDownloadPng}
                  disabled={route.length < 2 || downloadingPng}
                  title={route.length < 2 ? "Rute belum memiliki cukup titik" : "Download ringkasan sebagai PNG"}
                  className="btn btn-outline btn-lg flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-5 w-5" />
                  <span className="sr-only sm:not-sr-only">{downloadingPng ? "Membuat..." : pngDownloaded ? "Terunduh" : "Download Foto"}</span>
                </button>
                <button onClick={reset} className="btn btn-ghost btn-lg flex-1"><RotateCcw className="h-5 w-5" /> <span className="sr-only sm:not-sr-only">Baru</span></button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Stats */}
      <div className="contents lg:block lg:col-span-5 xl:col-span-4 lg:space-y-6">
        {/* 4. Stats -> Jarak di order-2, sisanya order-6 di mobile */}
        <div className="order-2 lg:order-none card card-pad border-line bg-card">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jarak Tempuh</p>
            <p className="font-display mt-1 text-6xl sm:text-7xl font-extrabold text-foreground tracking-tighter leading-none">
              {km.toFixed(2)}<span className="ml-1 text-2xl sm:text-3xl text-muted-foreground font-medium tracking-normal">km</span>
            </p>
          </div>

          <div className="order-6 lg:order-none mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary/30 p-3 text-center">
              <Timer className="mx-auto h-4 w-4 text-muted-foreground" />
              <p className="stat-num mt-1.5 text-lg font-bold">{formatTime(elapsed)}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Waktu</p>
            </div>
            <div className="rounded-2xl bg-secondary/30 p-3 text-center">
              <Gauge className="mx-auto h-4 w-4 text-muted-foreground" />
              <p className="stat-num mt-1.5 text-lg font-bold">{paceMinPerKm(distance, elapsed)}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Pace /km</p>
            </div>
            <div className="rounded-2xl bg-sky/10 p-3 text-center">
              <Bike className="mx-auto h-4 w-4 text-sky" />
              <p className="stat-num mt-1.5 text-lg font-bold text-sky">{displayedSpeed.toFixed(1)}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-sky/70 mt-0.5">km/jam</p>
            </div>
            <div className="rounded-2xl bg-brand-soft/50 p-3 text-center">
              <Zap className="mx-auto h-4 w-4 text-brand" />
              <p className="stat-num mt-1.5 text-lg font-bold text-brand">{xp}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-brand/70 mt-0.5">XP</p>
            </div>
          </div>
        </div>

        {/* Expandable/Scrollable Info -> order-5 di mobile */}
        <div className="order-5 lg:order-none card card-pad border-line bg-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Info Aktivitas</p>
          
          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-secondary/30 p-3 text-xs text-muted-foreground">
              <div className="flex justify-between items-center mb-1 font-bold text-foreground">
                <span>Batas XP Harian</span>
                <span>{xpEarnedToday} / {XP_SAFETY_POLICY.dailyCap}</span>
              </div>
              <div className="h-1.5 rounded-full bg-line overflow-hidden mb-1">
                <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, (xpEarnedToday / XP_SAFETY_POLICY.dailyCap) * 100)}%` }} />
              </div>
              <p className="text-[9px] leading-tight">XP penuh hingga {XP_SAFETY_POLICY.fullRateUntil}, lalu {XP_SAFETY_POLICY.reducedRate * 100}%.</p>
            </div>

            <details className="group rounded-xl border border-line bg-secondary/30 p-3 text-xs text-muted-foreground [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground">
                Pemeriksaan Integritas <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
              </summary>
              <div className="mt-3 space-y-2 text-[10px]">
                {integrityChecks.map((check) => (
                  <div key={check.label} className="flex justify-between border-b border-line/40 pb-1 last:border-0 last:pb-0">
                    <span className="flex items-center gap-1.5"><check.icon className={`h-3 w-3 ${check.issue ? 'text-amber' : 'text-brand'}`} /> {check.label}</span>
                    <span>{check.detail}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

      </div>
    </div>
  );
}
