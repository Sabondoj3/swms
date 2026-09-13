"use client";

import { useEffect, useState } from "react";

type Badge = {
  id: string;
  awardedAt: string;
  badge: {
    name: string;
    description?: string | null;
  };
};

type ProfileUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  institution: string | null;
  studentId: string | null;
  points: number;
  isActive: boolean;
  createdAt: string;
  badges: Badge[];
  _count: {
    reports: number;
    notifications: number;
  };
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    institution: "",
    studentId: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Unable to load profile.");
          return;
        }

        setUser(data.user);

        setForm({
          fullName: data.user.fullName ?? "",
          phone: data.user.phone ?? "",
          institution: data.user.institution ?? "",
          studentId: data.user.studentId ?? "",
        });
      } catch {
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to update profile.");
        return;
      }

      setUser((current) =>
        current
          ? {
              ...current,
              ...data.user,
            }
          : current
      );

      setMessage("Profile updated successfully.");
    } catch {
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-slate-500">Loading profile...</p>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <a
          href="/"
          className="mb-6 inline-block text-sm font-semibold text-green-700 hover:underline"
        >
          ← Back to Home
        </a>

        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <a
        href="/"
        className="mb-6 inline-block text-sm font-semibold text-green-700 hover:underline"
      >
        ← Back to Home
      </a>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your personal SWMS account information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
            {user.fullName
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>

          <h2 className="mt-4 text-xl font-bold">{user.fullName}</h2>

          <p className="text-sm text-slate-500">{user.email}</p>

          <div className="mt-5 space-y-2 text-sm">
            <p>
              <strong>Role:</strong>{" "}
              {user.role.replaceAll("_", " ")}
            </p>

            <p>
              <strong>Points:</strong> {user.points}
            </p>

            <p>
              <strong>Reports:</strong> {user._count.reports}
            </p>

            <p>
              <strong>Notifications:</strong>{" "}
              {user._count.notifications}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {user.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold">
            Personal Information
          </h2>

          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Full name
              </label>

              <input
                value={form.fullName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fullName: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-3 py-2 outline-none focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Email
              </label>

              <input
                value={user.email}
                disabled
                className="w-full rounded-xl border bg-slate-100 px-3 py-2 text-slate-500"
              />

              <p className="mt-1 text-xs text-slate-500">
                Email cannot be changed here.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Phone
              </label>

              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-3 py-2 outline-none focus:border-green-600"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Institution
              </label>

              <input
                value={form.institution}
                onChange={(e) =>
                  setForm({
                    ...form,
                    institution: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-3 py-2 outline-none focus:border-green-600"
                placeholder="School, university or organisation"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Student ID
              </label>

              <input
                value={form.studentId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    studentId: e.target.value,
                  })
                }
                className="w-full rounded-xl border px-3 py-2 outline-none focus:border-green-600"
                placeholder="Student ID"
              />
            </div>

            {message ? (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      </div>

      {user.badges.length > 0 ? (
        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">My Badges</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {user.badges.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-slate-50 p-4"
              >
                <p className="font-bold">{item.badge.name}</p>

                {item.badge.description ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {item.badge.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}