import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArticleEditorProps {
  content: string;
  titles: string[];
  metaDescription: string;
  tags: string[];
  onSave: (data: { content: string; title: string; metaDescription: string; tags: string[] }) => void;
}

export default function ArticleEditor({
  content,
  titles,
  metaDescription,
  tags,
  onSave
}: ArticleEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [selectedTitle, setSelectedTitle] = useState(titles[0]);
  const [editedMeta, setEditedMeta] = useState(metaDescription);
  const [editedTags, setEditedTags] = useState(tags);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Article Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[400px]"
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

            <Button
              onClick={() =>
                onSave({
                  content: editedContent,
                  title: selectedTitle,
                  metaDescription: editedMeta,
                  tags: editedTags,
                })
              }
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
