import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGenerateArticle } from "@/lib/api";

export function ArticleForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      url: "",
    },
  });

  const generateArticle = useGenerateArticle();

  const onSubmit = async (data: { url: string }) => {
    setIsGenerating(true);
    try {
      await generateArticle.mutateAsync(data.url);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Article</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register("url", { required: "YouTube URL is required" })}
              placeholder="Enter YouTube URL"
            />
            {errors.url && (
              <p className="text-sm text-red-500 mt-1">{errors.url.message}</p>
            )}
          </div>
          <Button disabled={isGenerating} type="submit">
            {isGenerating ? "Generating..." : "Generate Article"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
