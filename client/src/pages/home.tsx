import ArticleForm from "@/components/article-form";
import ArticleEditor from "@/components/article-editor";
import { useGenerateArticle, useSaveArticle } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const saveArticle = useSaveArticle();

  const { data: article } = useGenerateArticle({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article generated successfully. You can now edit it before saving.",
      });
    },
  });

  const handleSave = async (editedArticle: any) => {
    try {
      await saveArticle.mutateAsync({
        ...editedArticle,
        youtubeUrl: article?.youtubeUrl,
        seoScore: article?.seoScore,
        transcript: article?.transcript,
        keyTopics: article?.keyTopics,
      });

      toast({
        title: "Success",
        description: "Article saved to history.",
      });

      // Navigate to history page after successful save
      setLocation("/history");
    } catch (error) {
      console.error("Failed to save article:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Content Generator</h1>
      <ArticleForm />
      {article && (
        <ArticleEditor
          content={article.content}
          titles={article.seoTitles || []}
          metaDescription={article.metaDescription}
          tags={article.tags || []}
          transcript={article.transcript || ""}
          keyTopics={article.keyTopics || []}
          missingTopics={article.missingTopics || []}
          onSave={handleSave}
        />
      )}
    </div>
  );
}