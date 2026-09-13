"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const navigatorWithStandalone = window.navigator as Navigator & {
      standalone?: boolean;
    };

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      navigatorWithStandalone.standalone === true;

    if (standalone) {
      setIsInstalled(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();

      setInstallPrompt(
        event as BeforeInstallPromptEvent
      );
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      const isIOS =
        /iphone|ipad|ipod/i.test(
          window.navigator.userAgent
        );

      if (isIOS) {
        alert(
          'To install SWMS on iPhone or iPad, open this website in Safari, tap Share, then select "Add to Home Screen".'
        );
      } else {
        alert(
          'Installation is not available automatically yet. Open your browser menu and select "Install app" or "Add to Home screen".'
        );
      }

      return;
    }

    await installPrompt.prompt();

    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
        ✓ App Installed
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={installApp}
      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
    >
      <span aria-hidden="true">↓</span>
      Install App
    </button>
  );
}