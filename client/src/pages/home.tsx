import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ArticleEditor from "@/components/article-editor";
import SEOAnalyzer from "@/components/seo-analyzer";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (youtubeUrl: string) => {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article generated successfully",
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

  const handleGenerate = () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generateMutation.data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ArticleEditor
              content={generateMutation.data.content}
              titles={generateMutation.data.titleVariations}
              metaDescription={generateMutation.data.metaDescription}
              tags={generateMutation.data.tags}
              onSave={async (data) => {
                // Implement save functionality
                toast({
                  title: "Success",
                  description: "Changes saved successfully",
                });
              }}
            />
          </div>
          <div>
            <SEOAnalyzer
              score={generateMutation.data.seoScore}
              title={generateMutation.data.title}
              metaDescription={generateMutation.data.metaDescription}
              content={generateMutation.data.content}
              tags={generateMutation.data.tags}
            />
          </div>
        </div>
      )}
    </div>
  );
}
