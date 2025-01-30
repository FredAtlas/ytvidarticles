import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGenerateArticle } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface FormData {
  url: string;
}

export function ArticleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      url: "",
    },
  });

  const generateArticle = useGenerateArticle();

  const onSubmit = async (data: FormData) => {
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