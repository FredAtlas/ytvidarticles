import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "./queryClient";

interface GenerationChunk {
  originalText: string;
  summary: string;
  position: number;
}

interface Article {
  id: number;
  youtubeUrl: string;
  title: string;
  content: string;
  transcript: string;
  metaDescription: string;
  seoTitles: string[];
  tags: string[];
  seoScore: number;
  keyTopics: string[];
  missingTopics: string[];
  generationChunks: GenerationChunk[];
  createdAt: Date;
  updatedAt: Date;
}

interface GenerateArticleOptions {
  onProgress?: (step: string) => void;
  onSuccess?: () => void;
}

export function useArticle(id?: string) {
  return useQuery({
    queryKey: ["/api/articles", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch article");
      }
      const data = await res.json();
      return data as Article;
    },
    enabled: !!id,
  });
}

export function useGenerateArticle(options: GenerateArticleOptions = {}) {
  return useMutation({
    mutationFn: async (url: string) => {
      try {
        // Step 1: Extracting transcript
        options.onProgress?.("transcript");
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to generate article");
        }

        const data = await res.json();

        // Update progress through steps
        options.onProgress?.("analysis");
        options.onProgress?.("generation");
        options.onProgress?.("refinement");
        options.onProgress?.("completion");

        return data.data as Article;
      } catch (error: any) {
        console.error("Article generation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate the articles query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      options.onSuccess?.();

      // Show success message
      toast({
        title: "Success",
        description: "Article generated successfully. You can now edit it.",
      });
    },
    onError: (error: Error) => {
      // Show error message
      toast({
        title: "Error",
        description: error.message || "Failed to generate article",
        variant: "destructive",
      });
    },
  });
}

export function useSaveArticle() {
  return useMutation({
    mutationFn: async (articleData: Partial<Article>) => {
      const res = await fetch("/api/articles/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json() as Promise<Article>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useArticles() {
  return useQuery({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      if (!res.ok) {
        throw new Error("Failed to fetch articles");
      }
      return res.json() as Promise<Article[]>;
    }
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        throw new Error("Failed to fetch settings");
      }
      return res.json();
    }
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: async (settings: any) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}