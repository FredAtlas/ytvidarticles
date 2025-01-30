import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from 'react';

interface Progress {
  stage: string;
  percent: number;
}

export function useGenerateArticle() {
  const [progress, setProgress] = useState<Progress | null>(null);

  const mutation = useMutation({
    mutationFn: async (url: string) => {
      setProgress({ stage: "extracting_transcript", percent: 0 });

      // Use secure WebSocket if the page is loaded over HTTPS
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      // Handle WebSocket errors
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Unable to establish real-time connection. Progress updates may be delayed.",
          variant: "destructive",
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress') {
            setProgress(data.progress);
          } else if (data.type === 'error') {
            toast({
              title: "Error",
              description: data.message,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      try {
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const result = await res.json();
        ws.close();
        setProgress(null);
        return result;
      } catch (error) {
        ws.close();
        setProgress(null);
        throw error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { ...mutation, progress };
}

export function useArticles() {
  return useQuery({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      if (!res.ok) {
        throw new Error(await res.text());
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
        throw new Error(await res.text());
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