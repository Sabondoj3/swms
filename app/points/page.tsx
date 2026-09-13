"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";

const LeafletMap = dynamic(
  () => import("@/components/map/LeafletMap"),
  { ssr: false }
);

type CollectionPoint = {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
};

export default function PointsPage() {
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/points")
      .then((r) => r.json())
      .then((d) => {
        setPoints(d.points ?? []);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const center: [number, number] = points.length
    ? [points[0].latitude, points[0].longitude]
    : [26.1122288, 91.6520905];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <Link
        href="/"
        className="mb-5 inline-block text-sm font-semibold text-green-700 hover:underline"
      >
        ← Back to Home
      </Link>

      <div>
        <h1 className="text-xl font-extrabold">
          Collection Points
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View waste collection points on the live map and report problems at a specific location.
        </p>
      </div>

      <div className="mt-4">
        <LeafletMap
          points={points.map((p) => ({
            id: p.id,
            lat: p.latitude,
            lng: p.longitude,
            label: p.code,
            sub: p.name,
          }))}
          center={center}
        />
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">
          Loading collection points…
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {!loading &&
          points.map((p) => (
            <Card key={p.id}>
              <p className="font-mono text-sm font-bold">
                {p.code}
              </p>

              <p className="mt-1 text-sm font-semibold">
                {p.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {p.address} • {p.status}
              </p>

              <Link
                href={`/report?collectionPoint=${p.code}`}
                className="mt-3 inline-block text-xs font-semibold text-green-700 hover:underline"
              >
                Report here →
              </Link>
            </Card>
          ))}
      </div>

      {!loading && points.length === 0 ? (
        <Card className="mt-4">
          <p className="text-sm font-semibold">
            No collection points available
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Collection points added by administrators will appear here.
          </p>
        </Card>
      ) : null}
    </main>
  );
}