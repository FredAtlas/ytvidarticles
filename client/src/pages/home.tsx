import ArticleForm from "@/components/article-form";
import ArticleEditor from "@/components/article-editor";
import { useGenerateArticle, useSaveArticle, useArticle } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const saveArticle = useSaveArticle();

  // Fetch existing article if we're in edit mode
  const { data: existingArticle, isLoading: isLoadingArticle } = useArticle(id);

  const { data: generatedArticle } = useGenerateArticle({
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
        id: existingArticle?.id || editedArticle.id,
        youtubeUrl: (existingArticle || generatedArticle)?.youtubeUrl,
        seoScore: (existingArticle || generatedArticle)?.seoScore,
        transcript: (existingArticle || generatedArticle)?.transcript,
        keyTopics: (existingArticle || generatedArticle)?.keyTopics,
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

  // Show loading state while fetching article for edit
  if (id && isLoadingArticle) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Loading article...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">
        {id ? "Edit Article" : "Content Generator"}
      </h1>

      {!id && <ArticleForm />}

      {(existingArticle || generatedArticle) && (
        <ArticleEditor
          content={existingArticle?.content || generatedArticle?.content}
          titles={existingArticle?.seoTitles || generatedArticle?.seoTitles || []}
          metaDescription={existingArticle?.metaDescription || generatedArticle?.metaDescription}
          tags={existingArticle?.tags || generatedArticle?.tags || []}
          transcript={existingArticle?.transcript || generatedArticle?.transcript || ""}
          keyTopics={existingArticle?.keyTopics || generatedArticle?.keyTopics || []}
          missingTopics={existingArticle?.missingTopics || generatedArticle?.missingTopics || []}
          onSave={handleSave}
        />
      )}
    </div>
  );
}