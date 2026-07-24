"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Square, RotateCcw, Footprints, Bike, Timer, Gauge, Zap,
  TriangleAlert, ShieldCheck, Save, Check, Navigation, Radio,
  Car, ClockAlert, Scale, Accessibility, MoonStar, MessageSquareText,
  Download,
} from "lucide-react";
import {
  ACTIVITY, haversine, formatTime, paceMinPerKm, speedKmh, computeXp,
  applyDailyXpPolicy, XP_SAFETY_POLICY, type ActivityKind, type LatLng,
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
    const deviceSpeedKmh =
      typeof reportedSpeed === "number" && reportedSpeed >= 0
        ? reportedSpeed * 3.6
        : 0;
    const evaluatedSpeedKmh = Math.max(calculatedSpeedKmh, deviceSpeedKmh);
    const minimumMovementMeters = Math.max(
      2,
      Math.min(8, (typeof accuracy === "number" ? accuracy : 8) * 0.35),
    );
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
  const xp = suspicious ? 0 : xpPolicy.awarded;
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
    <div className="card card-pad">
      {/* activity type */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
                <Icon className="h-4 w-4" /> {ACTIVITY[k].label}
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
          <p className="stat-num mt-1.5 text-lg">{displayedSpeed.toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground">km/jam</p>
        </div>
        <div className="rounded-2xl bg-amber/15 p-3 text-center">
          <Zap className="mx-auto h-4 w-4 text-amber" />
          <p className="stat-num mt-1.5 text-lg text-amber">{xp}</p>
          <p className="text-[11px] text-muted-foreground">Estimasi XP aman</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-brand/20 bg-brand-soft/55 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-bold text-foreground">Pengaman progres harian</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  XP penuh sampai {XP_SAFETY_POLICY.fullRateUntil}, lalu {XP_SAFETY_POLICY.reducedRate * 100}% hingga batas {XP_SAFETY_POLICY.dailyCap} XP/hari.
                </p>
              </div>
            </div>
            <span className="pill border border-brand/20 bg-card text-[10px] font-bold text-brand">ATURAN SERVER</span>
          </div>
          <div className="chart-progress mt-3 h-2 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (xpEarnedToday / XP_SAFETY_POLICY.dailyCap) * 100)}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>{xpEarnedToday} XP diperoleh hari ini</span>
            <span>{xpPolicy.remainingToday} XP tersisa</span>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-secondary/45 p-4">
          <div className="flex items-start gap-2.5">
            <MoonStar className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
            <div>
              <p className="text-sm font-bold text-foreground">Istirahat tetap bagian dari progres</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Streak Protection menjaga ritme saat hari pemulihan, tetapi tidak memberi XP tambahan.
              </p>
              <span className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-wider text-sky">Roadmap server</span>
            </div>
          </div>
        </div>
      </div>

      {/* route + validity */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
        <div className="chart-surface chart-surface-sky h-40 rounded-2xl border border-line p-2">
          <LiveRouteMap
            segments={routeSegments}
            currentLocation={currentLocation}
            isTracking={status === "tracking"}
          />
        </div>
        <div className="flex flex-col justify-center gap-2 rounded-2xl border border-line p-4 sm:w-52">
          {suspicious ? (
            <div className="flex items-start gap-2 text-amber">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Perlu Ditinjau</p>
                <p className="text-xs text-muted-foreground">{rejected} segmen menunjukkan variasi kecepatan berlebih.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-brand">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Lolos Validasi Demo</p>
                <p className="text-xs text-muted-foreground">Sampel saat ini lolos pemeriksaan browser.</p>
              </div>
            </div>
          )}
          <p className="mt-1 text-[10px] leading-normal text-muted-foreground">
            Aktivitas ini telah melewati pemeriksaan integritas di server. Keputusan reward dan progres disimpan di database.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-foreground">Pemeriksaan integritas aktivitas</p>
            <p className="text-xs text-muted-foreground">Beberapa sinyal dinilai bersama; satu anomali bukan otomatis kecurangan.</p>
          </div>
          <span className="pill bg-secondary text-[10px] font-bold text-muted-foreground">PRATINJAU BROWSER</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {integrityChecks.map((check) => {
            const Icon = check.icon;
            return (
              <div key={check.label} className={`rounded-xl border p-3 ${check.issue ? "border-amber/30 bg-amber/10" : "border-line bg-secondary/35"}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${check.issue ? "text-amber" : "text-brand"}`} />
                  <p className="text-xs font-bold text-foreground">{check.label}</p>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{check.detail}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Deteksi spoofing GPS, replay, perangkat, dan keputusan reward final memerlukan verifikasi server.
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {status === "idle" && (
          <button
            onClick={begin}
            disabled={starting}
            className="btn btn-primary btn-lg disabled:cursor-wait disabled:opacity-60"
          >
            <Play className="h-5 w-5" /> {starting ? "Menyiapkan GPS..." : "Mulai"}
          </button>
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
              <span className="btn bg-brand-soft text-brand"><Check className="h-5 w-5" /> {suspicious ? "Riwayat pribadi tersimpan" : "Tersimpan di database"}</span>
            ) : (
              <button onClick={saveActivity} disabled={saving} className="btn btn-primary btn-lg disabled:opacity-60">
                <Save className="h-5 w-5" /> {saving ? "Mengirim..." : suspicious ? "Simpan sebagai riwayat pribadi" : `Simpan (Estimasi +${xp} XP)`}
              </button>
            )}
            {suspicious && (reviewRequested ? (
              <span className="btn bg-amber/15 text-amber"><Check className="h-5 w-5" /> Peninjauan diminta</span>
            ) : (
              <button onClick={() => setReviewRequested(true)} className="btn btn-outline btn-lg">
                <MessageSquareText className="h-5 w-5" /> Ajukan peninjauan
              </button>
            ))}
            <button
              onClick={handleDownloadPng}
              disabled={route.length < 2 || downloadingPng}
              title={route.length < 2 ? "Rute belum memiliki cukup titik" : "Download ringkasan sebagai PNG"}
              className="btn btn-outline btn-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {downloadingPng ? "Membuat PNG..." : pngDownloaded ? "PNG Terunduh" : "Download Foto"}
            </button>
            <button onClick={reset} className="btn btn-ghost btn-lg"><RotateCcw className="h-5 w-5" /> Aktivitas baru</button>
          </>
        )}
      </div>

      {status === "finished" && (
        <p className="mt-4 text-center text-xs text-muted-foreground leading-normal">
          {suspicious
            ? "Sesi tetap dapat disimpan sebagai riwayat pribadi, tetapi belum memberi XP sampai peninjauan selesai."
            : saved && serverAwardXp !== null
              ? `Aktivitas tersimpan. Reward server: ${serverAwardXp} XP.`
              : `Kerja bagus. Kamu menempuh ${km.toFixed(2)} km. Estimasi setelah pengaman harian: ${xp} XP.`}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-secondary/30 p-4">
        <div className="flex items-start gap-3">
          <Accessibility className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">Aktivitas indoor & adaptif</p>
              <span className="pill bg-card text-[10px] font-bold text-muted-foreground">RENCANA VALIDASI</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Gym, olahraga indoor, kursi roda, dan aktivitas adaptif memerlukan wearable atau peninjauan terstruktur agar tetap adil. Pada MVP, jalur ini belum memberi XP kompetitif.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
