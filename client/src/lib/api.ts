import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Article } from "@db/schema";

export type GenerationStep = {
  step: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
};

export function useGenerateArticle() {
  return useMutation({
    mutationFn: async (url: string) => {
      return new Promise<Article>((resolve, reject) => {
        const eventSource = new EventSource(`/api/articles?url=${encodeURIComponent(url)}`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.error) {
            eventSource.close();
            reject(new Error(data.error));
          } else if (data.article) {
            eventSource.close();
            resolve(data.article);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          reject(new Error("Failed to generate article"));
        };
      });
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
    },
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
    },
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