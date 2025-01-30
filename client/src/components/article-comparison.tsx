import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ArticleComparisonProps {
  article: string;
  transcript: string;
  keyTopics: string[];
  missingTopics: string[];
}

export function ArticleComparison({ article, transcript, keyTopics, missingTopics }: ArticleComparisonProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Content Coverage Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Topics Covered</h3>
              <ul className="list-disc pl-4">
                {keyTopics.map((topic, index) => (
                  <li key={index} className="text-green-600">{topic}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Topics Needing Coverage</h3>
              <ul className="list-disc pl-4">
                {missingTopics.map((topic, index) => (
                  <li key={index} className="text-red-600">{topic}</li>
                ))}
              </ul>
            </div>
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Review the transcript below to ensure all important information is included in your article.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Original Transcript</h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="whitespace-pre-wrap">{transcript}</div>
              </ScrollArea>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Generated Article</h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="whitespace-pre-wrap">{article}</div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
