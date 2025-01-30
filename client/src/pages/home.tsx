import { useState } from "react";
import { ArticleForm } from "@/components/article-form";
import ArticleEditor from "@/components/article-editor";
import { ProgressBar } from "@/components/progress-bar";
import { useGenerateArticle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: article, isPending, progress } = useGenerateArticle();
  const { toast } = useToast();
  const [editedArticle, setEditedArticle] = useState(article);

  const handleSave = async (data: {
    content: string;
    title: string;
    metaDescription: string;
    tags: string[];
  }) => {
    try {
      // TODO: Implement save functionality
      toast({
        title: "Changes saved",
        description: "Your article has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Content Generator</h1>
      <ArticleForm />

      {isPending && progress && (
        <ProgressBar stage={progress.stage} progress={progress.percent} />
      )}

      {article && (
        <div className="space-y-4">
          <ArticleEditor
            content={article.content}
            titles={article.seoTitles}
            metaDescription={article.metaDescription}
            tags={article.tags}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  );
}