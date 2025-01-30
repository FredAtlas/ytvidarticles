import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export function useGenerateArticle() {
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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

export function useArticles() {
  return useQuery({
    queryKey: ["/api/articles"],
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["/api/settings"],
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
