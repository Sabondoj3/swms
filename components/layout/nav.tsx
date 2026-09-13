"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  MapPin,
  Bell,
  BookOpen,
  User,
  Truck,
  LayoutDashboard,
  QrCode,
} from "lucide-react";
import { useSession } from "next-auth/react";

export function TopBar() {
  const { data } = useSession();
  const role = (data?.user as unknown as { role?: string })?.role;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-600 font-bold text-white">
            S
          </span>

          <span className="font-bold">SWMS</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/" className="hover:text-green-700">
            Home
          </Link>

          <Link href="/#how" className="hover:text-green-700">
            How It Works
          </Link>

          <Link href="/report" className="hover:text-green-700">
            Report Waste
          </Link>

          <Link href="/education" className="hover:text-green-700">
            Education
          </Link>

          {data?.user ? (
            <Link
              href="/notifications"
              className="hover:text-green-700"
            >
              Notifications
            </Link>
          ) : null}

          {role === "ADMIN" || role === "SUPER_ADMIN" ? (
            <Link
              href="/admin"
              className="font-semibold text-green-700"
            >
              Admin
            </Link>
          ) : null}

          {role === "COLLECTOR" ? (
            <Link
              href="/collector"
              className="font-semibold text-green-700"
            >
              Collector
            </Link>
          ) : null}

          {!data?.user ? (
            <>
              <Link
                href="/login"
                className="hover:text-green-700"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className="hover:text-green-700"
              >
                Profile
              </Link>

              <Link
                href="/dashboard"
                className="rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700"
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>

        {data?.user ? (
          <Link
            href="/notifications"
            className="rounded-lg border p-2 md:hidden"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white md:hidden"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

export function MobileNav() {
  const path = usePathname();
  const { data } = useSession();
  const role = (data?.user as unknown as { role?: string })?.role;

  const items =
    role === "COLLECTOR"
      ? [
          {
            href: "/collector",
            icon: Truck,
            label: "Jobs",
          },
          {
            href: "/points",
            icon: MapPin,
            label: "Bins",
          },
          {
            href: "/notifications",
            icon: Bell,
            label: "Alerts",
          },
          {
            href: "/profile",
            icon: User,
            label: "Me",
          },
        ]
      : role === "ADMIN" || role === "SUPER_ADMIN"
        ? [
            {
              href: "/admin",
              icon: LayoutDashboard,
              label: "Admin",
            },
            {
              href: "/admin/reports",
              icon: PlusCircle,
              label: "Reports",
            },
            {
              href: "/points",
              icon: MapPin,
              label: "Map",
            },
            {
              href: "/profile",
              icon: User,
              label: "Me",
            },
          ]
        : [
            {
              href: "/dashboard",
              icon: Home,
              label: "Home",
            },
            {
              href: "/report",
              icon: PlusCircle,
              label: "Report",
            },
            {
              href: "/scan",
              icon: QrCode,
              label: "Scan",
            },
            {
              href: "/points",
              icon: MapPin,
              label: "Bins",
            },
            {
              href: "/education",
              icon: BookOpen,
              label: "Learn",
            },
          ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        }}
      >
        {items.map((item) => {
          const active = path === item.href;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active
                  ? "text-green-700"
                  : "text-slate-500"
              }`}
            >
              <Icon size={20} />

              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <p className="font-bold">SWMS</p>

          <p className="mt-2 text-sm text-slate-500">
            Cleaner Communities Through Smart Technology.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">
            Explore
          </p>

          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
            <Link href="/report">
              Report Waste
            </Link>

            <Link href="/points">
              Collection Points
            </Link>

            <Link href="/education">
              Education
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">
            Roles
          </p>

          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
            <Link href="/dashboard">
              Students
            </Link>

            <Link href="/collector">
              Collectors
            </Link>

            <Link href="/admin">
              Admins
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">
            System
          </p>

          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
            <Link href="/profile">
              Profile
            </Link>

            <Link href="/login">
              Login
            </Link>

            <Link href="/register">
              Register
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SWMS — Smart Waste Management System
      </div>
    </footer>
  );
}