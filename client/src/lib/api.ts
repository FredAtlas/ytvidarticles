import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface GenerateArticleOptions {
  onProgress?: (step: string) => void;
}

export function useGenerateArticle(options: GenerateArticleOptions = {}) {
  return useMutation({
    mutationFn: async (url: string) => {
      // Step 1: Extracting transcript
      options.onProgress?.("transcript");
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate article');
      }

      // Update progress through steps
      options.onProgress?.("analysis");
      options.onProgress?.("generation");
      options.onProgress?.("refinement");
      options.onProgress?.("completion");

      return data.data;
    },
    onSuccess: () => {
      // Invalidate the articles query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
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

export function useArticles() {
  return useQuery({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      if (!res.ok) {
        throw new Error("Failed to fetch articles");
      }
      return res.json();
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