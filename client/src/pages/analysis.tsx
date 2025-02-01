import { useParams } from "wouter";
import { useArticle } from "@/lib/api";
import { ArticleComparison } from "@/components/article-comparison";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analysis() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: article, isLoading } = useArticle(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Article not found</h1>
      </div>
    );
  }

  // Debug logging to check chunks data
  console.log("Article data received:", {
    hasChunks: Boolean(article.generationChunks),
    chunkCount: article.generationChunks?.length,
    firstChunk: article.generationChunks?.[0]
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/history")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
        <h1 className="text-3xl font-bold">Article Analysis</h1>
      </div>
      <ArticleComparison
        article={article.content}
        transcript={article.transcript || ""}
        keyTopics={article.keyTopics || []}
        missingTopics={article.missingTopics || []}
        generationChunks={article.generationChunks || []}
      />
    </div>
  );
}