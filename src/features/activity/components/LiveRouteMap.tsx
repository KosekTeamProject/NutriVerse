"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LatLng } from "@/lib/activity";

type LiveRouteMapProps = {
  readonly segments: readonly (readonly LatLng[])[];
  readonly currentLocation: LatLng | null;
  readonly isTracking: boolean;
};

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ROUTE_SOURCE_ID = "nutriverse-live-route";
const ROUTE_SHADOW_LAYER_ID = "nutriverse-live-route-shadow";
const ROUTE_LAYER_ID = "nutriverse-live-route-line";

function routeFeature(segments: readonly (readonly LatLng[])[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "MultiLineString" as const,
      coordinates: segments
        .filter((segment) => segment.length >= 2)
        .map((segment) => segment.map((point) => [point.lng, point.lat])),
    },
  };
}

function createLocationMarkerElement() {
  const element = document.createElement("div");
  element.setAttribute("aria-label", "Lokasi GPS saat ini");
  Object.assign(element.style, {
    width: "18px",
    height: "18px",
    borderRadius: "9999px",
    background: "#0ea5e9",
    border: "3px solid white",
    boxShadow: "0 0 0 7px rgba(14,165,233,.22), 0 2px 8px rgba(0,0,0,.35)",
  });
  return element;
}

export function LiveRouteMap({
  segments,
  currentLocation,
  isTracking,
}: LiveRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const loadedRef = useRef(false);
  const latestFeatureRef = useRef(routeFeature(segments));
  const userMovedMapRef = useRef(false);
  const resumeFollowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feature = useMemo(() => routeFeature(segments), [segments]);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OPENFREEMAP_STYLE,
        center: [117.5, -2.5],
        zoom: 3.25,
        attributionControl: {},
        cooperativeGestures: false,
      });
      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
        "top-right",
      );

    map.on("style.load", () => {
      loadedRef.current = true;
      if (!map.getSource(ROUTE_SOURCE_ID)) {
        map.addSource(ROUTE_SOURCE_ID, {
          type: "geojson",
          data: latestFeatureRef.current,
        });
      }
      if (!map.getLayer(ROUTE_SHADOW_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_SHADOW_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "rgba(15, 23, 42, .42)",
            "line-width": 8,
            "line-blur": 1.2,
          },
        });
      }
      if (!map.getLayer(ROUTE_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#fc4c02",
            "line-width": 5,
          },
        });
      }
    });

    map.on("dragstart", (event: maplibregl.MapMouseEvent) => {
      if (!event.originalEvent) return;
      userMovedMapRef.current = true;
      if (resumeFollowTimerRef.current) clearTimeout(resumeFollowTimerRef.current);
    });
    map.on("dragend", () => {
      if (resumeFollowTimerRef.current) clearTimeout(resumeFollowTimerRef.current);
      resumeFollowTimerRef.current = setTimeout(() => {
        userMovedMapRef.current = false;
      }, 8_000);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

      return () => {
        if (resumeFollowTimerRef.current) clearTimeout(resumeFollowTimerRef.current);
        resizeObserver.disconnect();
        markerRef.current?.remove();
        markerRef.current = null;
        loadedRef.current = false;
        map.remove();
        mapRef.current = null;
      };
    } catch (error) {
      console.warn("WebGL Initialization failed:", error);
      setWebglError(true);
    }
  }, []);

  useEffect(() => {
    latestFeatureRef.current = feature;
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource(ROUTE_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(feature);
  }, [feature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentLocation) return;
    const coordinates: [number, number] = [currentLocation.lng, currentLocation.lat];

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        element: createLocationMarkerElement(),
        anchor: "center",
      })
        .setLngLat(coordinates)
        .addTo(map);
    } else {
      markerRef.current.setLngLat(coordinates);
    }

    if (!userMovedMapRef.current) {
      map.easeTo({
        center: coordinates,
        zoom: Math.max(map.getZoom(), 16),
        duration: isTracking ? 650 : 0,
        essential: true,
      });
    }
  }, [currentLocation, isTracking]);

  if (webglError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-secondary/20 p-4 text-center">
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-bold text-foreground">Peta Tidak Tersedia</p>
          <p className="text-xs text-muted-foreground">Perangkat atau browser Anda saat ini tidak mendukung WebGL yang diperlukan untuk menampilkan peta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <div ref={containerRef} className="h-full w-full" />
      {!currentLocation && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-background/80 px-3 py-2 text-center text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          Peta akan mengikuti lokasi saat GPS memperoleh sinyal
        </div>
      )}
    </div>
  );
}
