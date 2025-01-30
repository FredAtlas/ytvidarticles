import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: data.url }),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to initialize stream reader");
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(line.slice(6));

              if (eventData.error) {
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

              if (eventData.article) {
                setGeneratedArticle(eventData.article);
                setIsGenerating(false);
              }
            } catch (parseError) {
              console.error("Failed to parse event data:", parseError);
            }
          }
        }
      }
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