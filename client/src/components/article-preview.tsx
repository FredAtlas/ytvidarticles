import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOScore } from "./seo-score";
import type { Article } from "@db/schema";

interface ArticlePreviewProps {
  article: Article;
}

export function ArticlePreview({ article }: ArticlePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
        <div className="flex items-center gap-2">
          <SEOScore score={article.seoScore} />
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <p className="text-muted-foreground">{article.metaDescription}</p>
          <div className="mt-4">
            <h3 className="text-sm font-medium">Alternative Titles:</h3>
            <ul className="list-disc pl-4 mt-2">
              {article.seoTitles.map((title, i) => (
                <li key={i} className="text-sm">{title}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium">Content:</h3>
            <div className="mt-2 whitespace-pre-wrap">{article.content}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
