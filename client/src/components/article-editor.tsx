import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArticleComparison } from "./article-comparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiWordpress } from "react-icons/si";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GenerationChunk {
  originalText: string;
  summary: string;
  position: number;
}

interface ArticleEditorProps {
  id?: number;
  content: string;
  titles: string[];
  metaDescription: string;
  tags: string[];
  transcript?: string;
  keyTopics?: string[];
  missingTopics?: string[];
  generationChunks?: GenerationChunk[];
  onSave: (data: { id?: number; content: string; title: string; metaDescription: string; tags: string[] }) => void;
}

interface SocialMediaContent {
  twitter: {
    tweets: string[];
    hashtags: string[];
  };
  linkedin: {
    post: string;
    bullet_points: string[];
  };
  facebook: {
    post: string;
    key_points: string[];
  };
  instagram: {
    caption: string;
    hashtags: string[];
  };
}

export default function ArticleEditor({
  id: initialId,
  content,
  titles,
  metaDescription,
  tags,
  transcript = "",
  keyTopics = [],
  missingTopics = [],
  generationChunks = [],
  onSave
}: ArticleEditorProps) {
  const [articleId, setArticleId] = useState(initialId);
  const [editedContent, setEditedContent] = useState(content);
  const [selectedTitle, setSelectedTitle] = useState(titles[0]);
  const [editedMeta, setEditedMeta] = useState(metaDescription);
  const [editedTags, setEditedTags] = useState(tags);
  const { toast } = useToast();
  const [socialContent, setSocialContent] = useState<SocialMediaContent | null>(null);

  const generateSocialContent = useMutation({
    mutationFn: async () => {
      if (!articleId) {
        throw new Error("Article must be saved before generating social content");
      }
      const response = await fetch(`/api/articles/${articleId}/social-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to generate social media content");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSocialContent(data.data);
      toast({
        title: "Success",
        description: "Social media content generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportToWordPress = useMutation({
    mutationFn: async () => {
      if (!articleId) {
        throw new Error("Article must be saved before exporting to WordPress");
      }
      const response = await fetch(`/api/articles/${articleId}/wordpress-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to export to WordPress");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Article exported to WordPress as draft. View it here: ${data.data.url}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const improveContent = useMutation({
    mutationFn: async () => {
      if (!articleId) {
        throw new Error("Article must be saved before improving");
      }
      const response = await fetch(`/api/articles/${articleId}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });
      if (!response.ok) {
        throw new Error("Failed to improve content");
      }
      const data = await response.json();
      setEditedContent(data.content);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Content improved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    try {
      const savedArticle = await onSave({
        id: articleId,
        content: editedContent,
        title: selectedTitle,
        metaDescription: editedMeta,
        tags: editedTags,
      });
      if (savedArticle?.id) {
        setArticleId(savedArticle.id);
        window.history.replaceState(null, '', `/?id=${savedArticle.id}`);
      }
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (error) {
      console.error("Failed to save:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Article Editor</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => exportToWordPress.mutate()}
                      disabled={exportToWordPress.isPending || !articleId}
                      variant="outline"
                      className="gap-2"
                    >
                      {exportToWordPress.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Exporting to WordPress...
                        </>
                      ) : (
                        <>
                          <SiWordpress className="h-4 w-4" />
                          Export to WordPress
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {!articleId 
                    ? "Save the article first before exporting to WordPress" 
                    : "Export this article as a draft to WordPress"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="edit" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="edit">Edit Article</TabsTrigger>
              <TabsTrigger value="html">HTML Preview</TabsTrigger>
              <TabsTrigger value="compare">Compare with Transcript</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title Variations</label>
                <ScrollArea className="h-32 w-full rounded-md border p-4">
                  {titles.map((title, i) => (
                    <div
                      key={i}
                      className={`p-2 cursor-pointer rounded hover:bg-accent ${
                        title === selectedTitle ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedTitle(title)}
                    >
                      {title}
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] w-full rounded-md border p-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <Input
                  value={editedMeta}
                  onChange={(e) => setEditedMeta(e.target.value)}
                  maxLength={155}
                />
                <span className="text-xs text-muted-foreground">
                  {editedMeta.length}/155 characters
                </span>
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editedTags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        const newTags = [...editedTags];
                        newTags.splice(i, 1);
                        setEditedTags(newTags);
                      }}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                  <Input
                    placeholder="Add tag..."
                    className="w-32"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget;
                        if (input.value) {
                          setEditedTags([...editedTags, input.value]);
                          input.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => improveContent.mutate()}
                  disabled={improveContent.isPending || !articleId}
                >
                  {improveContent.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Improving Content...
                    </>
                  ) : (
                    "Improve Content"
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <div className="rounded-md border p-4 bg-white">
                <div dangerouslySetInnerHTML={{ 
                  __html: editedContent
                    .replace(/^####\s+(.*?)$/gm, '<h4>$1</h4>')
                    .replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>')
                    .replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>')
                    .replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .split('\n\n')
                    .map(paragraph => paragraph.trim())
                    .filter(Boolean)
                    .map(paragraph => `<p>${paragraph}</p>`)
                    .join('\n')
                }} />
              </div>
            </TabsContent>

            <TabsContent value="compare">
              <ArticleComparison
                article={editedContent}
                transcript={transcript}
                keyTopics={keyTopics}
                missingTopics={missingTopics}
                generationChunks={generationChunks}
              />
            </TabsContent>

            <TabsContent value="social">
              <div className="space-y-4">
                <Button
                  onClick={() => generateSocialContent.mutate()}
                  disabled={generateSocialContent.isPending || !articleId}
                  className="w-full"
                >
                  {generateSocialContent.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating social media content...
                    </>
                  ) : !articleId ? (
                    "Save article first to generate social content"
                  ) : (
                    "Generate Social Media Content"
                  )}
                </Button>

                {socialContent && (
                  <div className="space-y-6">
                    {/* Twitter */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Twitter Posts</h3>
                      <div className="space-y-2">
                        {socialContent.twitter.tweets.map((tweet, i) => (
                          <div key={i} className="p-4 rounded-lg border">
                            <p>{tweet}</p>
                            <div className="mt-2">
                              {socialContent.twitter.hashtags.map((tag, j) => (
                                <Badge key={j} variant="secondary" className="mr-2">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">LinkedIn Post</h3>
                      <div className="p-4 rounded-lg border">
                        <p>{socialContent.linkedin.post}</p>
                        <ul className="mt-2 list-disc pl-5">
                          {socialContent.linkedin.bullet_points.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Facebook */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Facebook Post</h3>
                      <div className="p-4 rounded-lg border">
                        <p>{socialContent.facebook.post}</p>
                        <div className="mt-2">
                          {socialContent.facebook.key_points.map((point, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              • {point}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Instagram */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Instagram Caption</h3>
                      <div className="p-4 rounded-lg border">
                        <p>{socialContent.instagram.caption}</p>
                        <div className="mt-2">
                          {socialContent.instagram.hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="mr-2">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}