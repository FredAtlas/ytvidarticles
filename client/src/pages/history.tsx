import { ArticlePreview } from "@/components/article-preview";
import { useArticles } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data: articles, isLoading } = useArticles();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold">History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">History</h1>
      <div className="space-y-4">
        {articles?.map((article) => (
          <ArticlePreview key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
