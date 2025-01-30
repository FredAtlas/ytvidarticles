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

      if (!res.ok) {
        throw new Error(await res.text());
      }

      // Step 2: Analyzing content (simulated by the backend)
      options.onProgress?.("analysis");

      // Step 3: Generating initial draft
      options.onProgress?.("generation");

      // Step 4: Refining content
      options.onProgress?.("refinement");

      // Step 5: Finalizing
      options.onProgress?.("completion");

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