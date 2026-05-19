import { notFound } from "next/navigation";
import { Metadata } from "next";
import { generateTitle } from "@/lib/seo";
import { getNewsroomPost, getAllSlugs } from "@/lib/mdx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getNewsroomPost(slug);
  if (!post) return {};
  return {
    title: generateTitle(post.title),
    description: post.description,
  };
}

export default async function NewsroomPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getNewsroomPost(slug);

  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto min-h-screen py-10 lg:py-20 px-4">
      <Link
        href="/newsroom"
        className="text-sm text-muted-foreground hover:text-neutral-900 transition-colors mb-8 inline-block"
      >
        ← Newsroom
      </Link>
      <p className="text-xs text-muted-foreground mb-3">{post.date}</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-6">{post.title}</h1>
      <div className="text-neutral-700 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-neutral-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-neutral-900">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </div>
  );
}
