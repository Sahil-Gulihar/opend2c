import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface NewsroomPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  readingTime: number;
  content: string;
}

export async function getNewsroomPosts(): Promise<NewsroomPost[]> {
  try {
    const newsroomDir = path.join(process.cwd(), "content/newsroom");

    if (!fs.existsSync(newsroomDir)) {
      console.log("Newsroom posts directory not found, returning empty array");
      return [];
    }

    const files = fs.readdirSync(newsroomDir);
    const posts = files
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => {
        const slug = file.replace(".mdx", "");
        const filePath = path.join(newsroomDir, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data, content } = matter(fileContent);

        return {
          slug,
          title: data.title || "",
          description: data.description || "",
          date: data.date || "",
          author: data.author || "",
          tags: data.tags || [],
          published: data.published !== false,
          featured: data.featured || false,
          readingTime: data.readingTime || "5 min read",
          content: content || "",
        };
      })
      .filter((post) => post.published)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
  } catch (error) {
    console.error("Error reading newsroom posts:", error);
    return [];
  }
}

export function getNewsroomPost(slug: string): NewsroomPost | null {
  const newsroomDir = path.join(process.cwd(), "content/newsroom");
  const filePath = path.join(newsroomDir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);

    return {
      slug,
      content,
      ...data,
    } as NewsroomPost;
  } catch (error) {
    console.error(`Error loading newsroom post ${slug}:`, error);
    return null;
  }
}

export function getAllSlugs(): string[] {
  const directory = path.join(process.cwd(), "content/newsroom");

  try {
    const fileNames = fs.readdirSync(directory);
    return fileNames
      .filter((name) => name.endsWith(".mdx"))
      .map((fileName) => fileName.replace(/\.mdx$/, ""));
  } catch (error) {
    return [];
  }
}
