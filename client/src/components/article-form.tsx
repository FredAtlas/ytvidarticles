import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGenerateArticle } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { ArticleGenerationProgress, GenerationStep } from "./article-generation-progress";

interface FormData {
  url: string;
}

const GENERATION_STEPS: GenerationStep[] = [
  { id: "transcript", label: "Extracting Video Transcript", status: "pending" },
  { id: "analysis", label: "Analyzing Content", status: "pending" },
  { id: "generation", label: "Generating Initial Draft", status: "pending" },
  { id: "refinement", label: "Refining Content", status: "pending" },
  { id: "completion", label: "Finalizing Article", status: "pending" }
];

export function ArticleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      url: "",
    },
  });

  const [steps, setSteps] = useState<GenerationStep[]>(GENERATION_STEPS);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const generateArticle = useGenerateArticle({
    onProgress: (step: string) => {
      setSteps(prev => 
        prev.map(s => {
          if (s.id === step) {
            return { ...s, status: "active" };
          } else if (s.status === "active") {
            return { ...s, status: "completed" };
          }
          return s;
        })
      );
      const newStepIndex = steps.findIndex(s => s.id === step);
      if (newStepIndex !== -1) {
        setCurrentStep(newStepIndex);
      }
    }
  });

  const onSubmit = async (data: FormData) => {
    // Reset progress
    setSteps(GENERATION_STEPS);
    setCurrentStep(0);
    await generateArticle.mutateAsync(data.url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Article</CardTitle>
        <CardDescription>
          Supports standard YouTube URLs and Shorts URLs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register("url", { 
                required: "YouTube URL is required",
                pattern: {
                  value: /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/).+/,
                  message: "Please enter a valid YouTube URL (standard or Shorts)"
                }
              })}
              placeholder="Enter YouTube URL (e.g., youtube.com/watch?v=... or youtube.com/shorts/...)"
              disabled={generateArticle.isPending}
            />
            {errors.url && (
              <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
            )}
          </div>

          {generateArticle.isPending && (
            <ArticleGenerationProgress 
              steps={steps}
              currentStep={currentStep}
            />
          )}

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
      </CardContent>
    </Card>
  );
}