"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

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
  profileImage: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    institution: "",
    studentId: "",
    profileImage: "",
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
          profileImage: data.user.profileImage ?? "",
        });
      } catch {
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("kind", "PROFILE");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        setError(uploadData.error ?? "Unable to upload profile photo.");
        return;
      }

      const imageUrl = uploadData.url;

      const saveResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          profileImage: imageUrl,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        setError(saveData.error ?? "Unable to save profile photo.");
        return;
      }

      setForm((current) => ({
        ...current,
        profileImage: imageUrl,
      }));

      setUser((current) =>
        current
          ? {
              ...current,
              profileImage: imageUrl,
            }
          : current
      );

      setMessage("Profile photo updated successfully.");
    } catch {
      setError("Unable to upload profile photo.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function removeProfilePhoto() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          profileImage: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to remove profile photo.");
        return;
      }

      setForm((current) => ({
        ...current,
        profileImage: "",
      }));

      setUser((current) =>
        current
          ? {
              ...current,
              profileImage: null,
            }
          : current
      );

      setMessage("Profile photo removed.");
    } catch {
      setError("Unable to remove profile photo.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();

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

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{error}</p>
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your account and personal information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.fullName}
                className="h-28 w-28 rounded-full border-4 border-green-100 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
                {getInitials(user.fullName)}
              </div>
            )}

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {user.fullName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">{user.email}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Uploading..."
                  : user.profileImage
                  ? "Change Photo"
                  : "Upload Photo"}
              </button>

              {user.profileImage && (
                <button
                  type="button"
                  onClick={removeProfilePhoto}
                  disabled={saving}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Role
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {user.role.replaceAll("_", " ")}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Points
              </p>
              <p className="mt-1 text-lg font-bold text-green-700">
                {user.points}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Reports
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {user._count.reports}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Notifications
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {user._count.notifications}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Account Status
            </p>

            <p
              className={`mt-1 text-sm font-bold ${
                user.isActive ? "text-green-700" : "text-red-600"
              }`}
            >
              {user.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update your contact and institution details.
          </p>

          {message && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={saveProfile} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                value={user.email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />

              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed from this page.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone
              </label>

              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="Enter phone number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Institution
              </label>

              <input
                value={form.institution}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    institution: event.target.value,
                  }))
                }
                placeholder="Enter institution"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Student ID
              </label>

              <input
                value={form.studentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    studentId: event.target.value,
                  }))
                }
                placeholder="Enter student ID"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>

          {user.badges.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-slate-900">Badges</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {user.badges.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {item.badge.name}
                    </p>

                    {item.badge.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {item.badge.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}