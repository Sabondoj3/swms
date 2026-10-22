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
  type: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pushState, setPushState] = useState<"idle" | "working" | "enabled" | "unavailable" | "denied">("idle");
  const [pushMessage, setPushMessage] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      const response = await fetch("/api/notifications", { signal: controller.signal, cache: "no-store" });
      window.clearTimeout(timeout);
      const d = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(d.error ?? "Could not load notifications");
      setItems(d.notifications ?? []);
    } catch (error) {
      setItems([]);
      setLoadError(error instanceof DOMException && error.name === "AbortError" ? "Notifications took too long to load. Check your connection and try again." : error instanceof Error ? error.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function withTimeout<T>(promise: Promise<T>, message: string, milliseconds = 12000) {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), milliseconds)),
    ]);
  }

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

  async function enablePhoneNotifications() {
    setPushState("working");
    setPushMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setPushState("unavailable"); setPushMessage("Phone push notifications are not supported by this browser."); return; }
      if (!window.isSecureContext) { setPushState("unavailable"); setPushMessage("Phone notifications require the secure HTTPS SWMS website. Do not use an HTTP preview link."); return; }
      const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isInstalledApp = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (isAppleMobile && !isInstalledApp) { setPushState("unavailable"); setPushMessage("On iPhone or iPad, open SWMS in Safari, tap Share, choose Add to Home Screen, open the new SWMS icon, then enable phone notifications again."); return; }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { setPushState("unavailable"); setPushMessage("Phone notifications are not configured on this deployment yet."); return; }
      if (Notification.permission === "denied") { setPushState("denied"); setPushMessage("Notifications are blocked for this site. Allow them in your phone browser settings, then try again."); return; }
      const permission = await withTimeout(Notification.requestPermission(), "The browser did not respond to the notification permission request.");
      if (permission !== "granted") { setPushState("denied"); setPushMessage("Allow notifications in your phone browser settings to receive SWMS alerts."); return; }
      const registration = await withTimeout(navigator.serviceWorker.register("/sw.js"), "The SWMS notification service could not be installed.");
      await withTimeout(navigator.serviceWorker.ready, "The SWMS notification service did not become ready.");
      const base64 = publicKey.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(publicKey.length / 4) * 4, "=");
      const key = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const subscription = await withTimeout(registration.pushManager.getSubscription().then((existing) => existing ?? registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })), "The browser could not create a phone notification subscription.");
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()), signal: controller.signal });
      window.clearTimeout(timer);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "The phone notification subscription could not be saved.");
      setPushState("enabled");
      setPushMessage("Phone notifications are enabled for this device.");
    } catch (error) {
      setPushState("unavailable");
      const errorName = error instanceof DOMException ? error.name : error instanceof Error ? error.name : "UnknownError";
      const errorMessage = error instanceof Error ? error.message : "Unknown browser error";
      setPushMessage(errorName === "NotAllowedError" ? "The browser blocked phone notifications. Allow notifications for SWMS in browser settings, then try again." : errorName === "AbortError" ? "Saving the phone notification subscription timed out. Check your connection and try again." : `Phone notifications could not be enabled (${errorName}: ${errorMessage}).`);
    }
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

      <Card className="mt-4 border-blue-200 bg-blue-50"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-blue-950">Phone notifications</p><p className="mt-1 text-sm text-blue-800">Receive collection reviews, confirmations, and payment updates even when SWMS is in the background.</p>{pushMessage ? <p className={`mt-2 text-xs font-semibold ${pushState === "enabled" ? "text-green-700" : "text-blue-900"}`}>{pushMessage}</p> : null}</div><SecondaryButton onClick={enablePhoneNotifications} disabled={pushState === "working" || pushState === "enabled"}>{pushState === "working" ? "Enabling…" : pushState === "enabled" ? "Enabled" : "Enable on this phone"}</SecondaryButton></div></Card>

      <div className="mt-4 grid gap-2">
        {loading ? (
          <p className="text-sm text-slate-500">
            Loading notifications…
          </p>
        ) : null}

        {!loading && loadError ? (
          <Card className="border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-800">{loadError}</p>
            <SecondaryButton className="mt-3" onClick={load}>Try again</SecondaryButton>
          </Card>
        ) : null}

        {!loading &&
          !loadError &&
          items.map((n) => {
            const openLink = n.type === "WASTE_COLLECTED" && n.link?.startsWith("/admin/reports/") ? "/admin/confirmations" : n.link;
            return (
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
                {openLink ? (
                  <Link
                    href={openLink}
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
            );
          })}

        {!loading &&
        !loadError &&
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
