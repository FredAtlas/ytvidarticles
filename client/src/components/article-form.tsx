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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      url: "",
    },
  });

  const generateArticle = useGenerateArticle();

  const onSubmit = async (data: FormData) => {
    try {
      setGeneratedArticle(null); // Reset any previous article
      const eventSource = new EventSource(`/api/articles?url=${encodeURIComponent(data.url)}`);

      eventSource.onmessage = (event) => {
        const eventData = JSON.parse(event.data);
        if (eventData.error) {
          eventSource.close();
          throw new Error(eventData.error);
        } else if (eventData.steps) {
          setGenerationSteps(eventData.steps.map((step: any) => ({
            label: step.step,
            status: step.status
          })));
        } else if (eventData.article) {
          setGeneratedArticle(eventData.article);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        throw new Error("Failed to generate article");
      };
    } catch (error) {
      console.error("Generation error:", error);
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
                disabled={generateArticle.isPending}
              />
              {errors.url && (
                <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={generateArticle.isPending}
              className="w-full"
            >
              {generateArticle.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating article...
                </>
              ) : (
                "Generate Article"
              )}
            </Button>
          </form>

          {generateArticle.isPending && (
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