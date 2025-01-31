import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GenerationChunk {
  originalText: string;
  summary: string;
  position: number;
}

interface ArticleComparisonProps {
  article: string;
  transcript: string;
  keyTopics: string[];
  missingTopics: string[];
  generationChunks?: GenerationChunk[];
  onAddSection?: (section: string) => Promise<void>;
}

export function ArticleComparison({ 
  article, 
  transcript, 
  keyTopics, 
  missingTopics,
  generationChunks = [],
  onAddSection 
}: ArticleComparisonProps) {
  const [selectedText, setSelectedText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("full");

  const handleSentenceClick = (text: string) => {
    setSelectedText(text);
  };

  const handleAddSection = async () => {
    if (!selectedText || !onAddSection) return;

    try {
      setIsAdding(true);
      await onAddSection(selectedText);
      setSelectedText("");
    } catch (error) {
      console.error("Failed to add section:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Debug logging to check if chunks are being received
  console.log("Generation chunks received:", generationChunks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Analysis</CardTitle>
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
              Review the transcript chunks below to see how the content was processed and generated.
              Click any section to add it to the article.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="full" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="full">Full View</TabsTrigger>
              <TabsTrigger value="chunks">Chunk Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="full" className="mt-4">
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
            </TabsContent>

            <TabsContent value="chunks" className="mt-4">
              {generationChunks && generationChunks.length > 0 ? (
                <div className="space-y-4">
                  {generationChunks.map((chunk, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Original Chunk {index + 1}</h4>
                          <div 
                            className="p-2 rounded border cursor-pointer hover:bg-accent/10"
                            onClick={() => handleSentenceClick(chunk.originalText)}
                          >
                            {chunk.originalText}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Generated Summary</h4>
                          <div className="p-2 rounded border bg-muted/50">
                            {chunk.summary}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No chunk analysis available for this article. This may occur for articles generated before the chunk analysis feature was added.
                </div>
              )}
            </TabsContent>
          </Tabs>

          {selectedText && onAddSection && (
            <div className="border rounded-lg p-4 bg-accent/10">
              <h4 className="font-semibold mb-2">Selected Content</h4>
              <p className="mb-4">{selectedText}</p>
              <Button 
                onClick={handleAddSection} 
                disabled={isAdding}
              >
                {isAdding ? "Adding to Article..." : "Add Selected Content"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}