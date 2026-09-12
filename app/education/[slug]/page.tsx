import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/nav";
import { Card } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function EducationDetail({ params }: { params: { slug: string } }) {
  const post = await prisma.educationalPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.published) notFound();
  return (
    <div>
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-xs font-bold text-green-700">{post.category}</p>
        <h1 className="mt-1 text-2xl font-extrabold">{post.title}</h1>
        <Card className="mt-4 whitespace-pre-line text-sm leading-relaxed">{post.content}</Card>
      </main>
    </div>
  );
}
