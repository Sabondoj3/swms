import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/primitives";
import { TopBar, MobileNav } from "@/components/layout/nav";

export const dynamic = "force-dynamic";

export default async function EducationList() {
  const posts = await prisma.educationalPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  const cats = Array.from(
    new Set(posts.map((p) => p.category))
  );

  return (
    <div className="pb-24">
      <TopBar />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link
          href="/"
          className="mb-5 inline-block text-sm font-semibold text-green-700 hover:underline"
        >
          ← Back to Home
        </Link>

        <h1 className="text-xl font-extrabold">
          Learn About Waste
        </h1>

        <div className="mt-2 flex flex-wrap gap-2">
          {cats.map((c) => (
            <span
              key={c}
              className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/education/${p.slug}`}
            >
              <Card>
                <p className="text-xs font-bold text-green-700">
                  {p.category}
                </p>

                <p className="mt-1 font-bold">
                  {p.title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {p.excerpt}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}