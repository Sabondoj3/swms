"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

function fixIcons() {
  // Use CDN icons to avoid bundling marker images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sub?: string;
  color?: string;
};

function ClickPicker({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function RecenterMap({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

export default function LeafletMap({
  points,
  center,
  zoom = 14,
  onPick,
  pickMarker,
}: {
  points: MapPoint[];
  center: [number, number];
  zoom?: number;
  onPick?: (lat: number, lng: number) => void;
  pickMarker?: { lat: number; lng: number } | null;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fixIcons();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="grid h-64 place-items-center rounded-2xl bg-slate-100 text-sm text-slate-500">
        Loading map…
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{
        height: 320,
        width: "100%",
        borderRadius: 16,
      }}
      scrollWheelZoom={false}
    >
      <RecenterMap center={center} zoom={zoom} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]}>
          <Popup>
            <strong>{p.label}</strong>
            {p.sub ? <div>{p.sub}</div> : null}
          </Popup>
        </Marker>
      ))}

      {pickMarker ? (
        <Marker position={[pickMarker.lat, pickMarker.lng]}>
          <Popup>Selected location</Popup>
        </Marker>
      ) : null}

      {onPick ? <ClickPicker onPick={onPick} /> : null}
    </MapContainer>
  );
}