import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArticlePreviewProps {
  content: string;
  titles?: string[];
  metaDescription?: string;
  tags?: string[];
}

export default function ArticlePreview({
  content,
  titles,
  metaDescription,
  tags,
}: ArticlePreviewProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {titles && titles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Suggested Titles</h3>
            <ul className="space-y-2">
              {titles.map((title, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {metaDescription && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Meta Description</h3>
            <p className="text-sm text-muted-foreground">{metaDescription}</p>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Content</h3>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
