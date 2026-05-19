import { Metadata } from "next";
import { generateTitle, generateDescription } from "@/lib/seo";
import { getNewsroomPosts } from "@/lib/mdx";
import Link from "next/link";

export const metadata: Metadata = {
  title: generateTitle("Newsroom"),
  description: generateDescription(
    "Insights, updates, and stories from the Open D2C team.",
  ),
};

export default async function NewsroomPage() {
  const posts = await getNewsroomPosts();

  return (
    <div className="max-w-3xl mx-auto min-h-screen py-10 lg:py-20 px-4">
      <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3">Newsroom</h1>
      <p className="text-lg text-muted-foreground mb-12">
        Insights, updates, and stories from the Open D2C team.
      </p>

      {posts.length === 0 ? (
        <p className="text-neutral-500">No posts yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-100">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/newsroom/${post.slug}`}
              className="py-6 group"
            >
              <p className="text-xs text-muted-foreground mb-2">{post.date}</p>
              <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-neutral-600">{post.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
