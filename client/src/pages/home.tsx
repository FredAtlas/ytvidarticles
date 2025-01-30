import { ArticleForm } from "@/components/article-form";
import { ArticlePreview } from "@/components/article-preview";
import { useGenerateArticle } from "@/lib/api";

export default function Home() {
  const { data: article } = useGenerateArticle();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Content Generator</h1>
      <ArticleForm />
      {article && <ArticlePreview article={article} />}
    </div>
  );
}
