"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, SecondaryButton } from "@/components/ui/primitives";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link: string | null;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const d = await fetch("/api/notifications")
        .then((r) => r.json())
        .catch(() => ({ notifications: [] }));

      setItems(d.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        markAll: true,
      }),
    });

    load();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
      }),
    });

    load();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Link
        href="/"
        className="mb-5 inline-block text-sm font-semibold text-green-700 hover:underline"
      >
        ← Back to Home
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View updates about your waste reports and system activity.
          </p>
        </div>

        {items.length > 0 ? (
          <SecondaryButton onClick={markAll}>
            Mark all read
          </SecondaryButton>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        {loading ? (
          <p className="text-sm text-slate-500">
            Loading notifications…
          </p>
        ) : null}

        {!loading &&
          items.map((n) => (
            <Card
              key={n.id}
              className={
                n.read
                  ? "opacity-70"
                  : "border-green-300"
              }
            >
              <p className="text-sm font-bold">
                {n.title}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {n.message}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {new Date(
                  n.createdAt
                ).toLocaleString()}
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                {n.link ? (
                  <Link
                    href={n.link}
                    className="text-xs font-semibold text-green-700 hover:underline"
                  >
                    Open →
                  </Link>
                ) : null}

                {!n.read ? (
                  <button
                    type="button"
                    onClick={() =>
                      markOne(n.id)
                    }
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </Card>
          ))}

        {!loading &&
        items.length === 0 ? (
          <Card>
            <p className="text-sm font-semibold">
              No notifications
            </p>

            <p className="mt-1 text-sm text-slate-500">
              New updates will appear here.
            </p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}