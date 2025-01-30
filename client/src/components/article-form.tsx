import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGenerateArticle } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { ProgressSteps, type ProgressStep } from "@/components/ui/progress-steps";
import { ArticleEditor } from "./article-editor";
import type { Article } from "@db/schema";
import { toast } from "@/hooks/use-toast";

interface FormData {
  url: string;
}

export function ArticleForm() {
  const [generationSteps, setGenerationSteps] = useState<ProgressStep[]>([
    { label: "Fetching transcript", status: "waiting" },
    { label: "Generating article", status: "waiting" },
    { label: "Refining content", status: "waiting" },
    { label: "Saving article", status: "waiting" }
  ]);
  const [generatedArticle, setGeneratedArticle] = useState<Article | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedArticle(null);

    try {
      const eventSource = new EventSource(`/api/articles?url=${encodeURIComponent(data.url)}`);

      eventSource.onmessage = (event) => {
        const eventData = JSON.parse(event.data);

        if (eventData.error) {
          eventSource.close();
          toast({
            title: "Error",
            description: eventData.error,
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }

        if (eventData.steps) {
          setGenerationSteps(eventData.steps.map((step: any) => ({
            label: step.step,
            status: step.status
          })));
        }

        // Check if all steps are completed
        const allCompleted = eventData.steps?.every((step: any) => step.status === 'completed');
        if (allCompleted) {
          eventSource.close();
          setIsGenerating(false);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsGenerating(false);
        toast({
          title: "Error",
          description: "Failed to generate article. Please try again.",
          variant: "destructive",
        });
      };
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...register("url", { 
                  required: "YouTube URL is required",
                  pattern: {
                    value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
                    message: "Please enter a valid YouTube URL"
                  }
                })}
                placeholder="Enter YouTube URL"
                disabled={isGenerating}
              />
              {errors.url && (
                <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating article...
                </>
              ) : (
                "Generate Article"
              )}
            </Button>
          </form>

          {isGenerating && (
            <div className="mt-6">
              <ProgressSteps steps={generationSteps} />
            </div>
          )}
        </CardContent>
      </Card>

      {generatedArticle && (
        <ArticleEditor
          article={generatedArticle}
          onSave={async (editedArticle) => {
            // Handle saving edited article
            console.log("Saving edited article:", editedArticle);
          }}
        />
      )}
    </div>
  );
}