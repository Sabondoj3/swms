"use client";
import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui/primitives";

export default function AdminEducation() {
  const [posts, setPosts] = useState<{ id: string; title: string; slug: string; category: string }[]>([]);
  const [form, setForm] = useState({ title: "", slug: "", category: "Recycling", excerpt: "", content: "" });
  async function load() {
    const d = await fetch("/api/education").then((r) => r.json()).catch(() => ({ posts: [] }));
    setPosts(d.posts ?? []);
  }
  useEffect(() => { load(); }, []);
  async function create() {
    const res = await fetch("/api/education", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, published: true }) });
    if (res.ok) { setForm({ title: "", slug: "", category: "Recycling", excerpt: "", content: "" }); load(); }
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-extrabold">Education content</h1>
      <Card className="mt-4 grid gap-2">
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} />
        <Input placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Input placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <textarea placeholder="Content (markdown-ish)" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl border px-3 py-2 text-sm" />
        <Button onClick={create}>Publish</Button>
      </Card>
      <div className="mt-4 grid gap-2">{posts.map((p) => <Card key={p.id}><p className="text-sm font-bold">{p.title}</p><p className="text-xs text-slate-500">{p.category} • /education/{p.slug}</p></Card>)}</div>
    </main>
  );
}
