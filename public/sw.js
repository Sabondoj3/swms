self.addEventListener("install", (event) => { event.waitUntil(self.skipWaiting()); });
self.addEventListener("activate", (event) => { event.waitUntil(clients.claim()); });
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || "FAMBUL GREEN notification";
  const options = { body: data.message || "You have a new FAMBUL GREEN update.", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { link: data.link || "/notifications" } };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/notifications";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((window) => "focus" in window);
    if (existing) { existing.navigate(link); return existing.focus(); }
    return clients.openWindow(link);
  }));
});
