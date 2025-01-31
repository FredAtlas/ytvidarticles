import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import DiffMatchPatch from "diff-match-patch";

interface ArticleComparisonProps {
  article: string;
  transcript: string;
  keyTopics: string[];
  missingTopics: string[];
  onAddSection?: (section: string) => Promise<void>;
}

export function ArticleComparison({ 
  article, 
  transcript, 
  keyTopics, 
  missingTopics,
  onAddSection 
}: ArticleComparisonProps) {
  const [selectedText, setSelectedText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  // Split into more manageable segments (sentences and small paragraphs)
  const segments = transcript
    .split(/([.!?]\s+)/)
    .reduce((acc: string[], part, i, arr) => {
      // Combine sentence with its punctuation
      if (i % 2 === 0 && arr[i + 1]) {
        acc.push(part + arr[i + 1]);
      } else if (i % 2 === 0) {
        acc.push(part);
      }
      return acc;
    }, [])
    .filter(s => s.trim().length > 0);

  // Enhanced coverage detection algorithm
  const isSegmentCovered = useCallback((segment: string) => {
    if (!segment.trim()) return true;

    const dmp = new DiffMatchPatch();
    const words = segment.toLowerCase().split(/\s+/);
    const articleLower = article.toLowerCase();

    // Check for exact phrases (3+ word sequences)
    const phrases = words.slice(0, -2).map((_, i) => 
      words.slice(i, i + 3).join(' ')
    );
    const hasMatchingPhrases = phrases.some(phrase => 
      articleLower.includes(phrase) && phrase.split(/\s+/).length >= 3
    );

    // Check for key terms coverage
    const significantWords = words.filter(w => w.length > 3);
    const coveredWords = significantWords.filter(word => articleLower.includes(word));
    const wordCoverageRatio = coveredWords.length / significantWords.length;

    return hasMatchingPhrases || wordCoverageRatio > 0.75;
  }, [article]);

  const handleSegmentClick = (index: number) => {
    if (selectionStart === null) {
      // Start new selection
      setSelectionStart(index);
      setSelectedText(segments[index]);
    } else {
      // Complete selection
      const start = Math.min(selectionStart, index);
      const end = Math.max(selectionStart, index);

      // Get the selected segments with one segment of context on each side
      const contextStart = Math.max(0, start - 1);
      const contextEnd = Math.min(segments.length - 1, end + 1);

      const selectedSegments = segments.slice(contextStart, contextEnd + 1);
      setSelectedText(selectedSegments.join(' '));
      setSelectionStart(null);
    }
  };

  const handleAddSection = async () => {
    if (!selectedText || !onAddSection) return;

    try {
      setIsAdding(true);
      await onAddSection(selectedText);
      setSelectedText("");
      setSelectionStart(null);
    } catch (error) {
      console.error("Failed to add section:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Calculate coverage statistics
  const totalSegments = segments.length;
  const coveredSegments = segments.filter(isSegmentCovered).length;
  const coveragePercentage = Math.round((coveredSegments / totalSegments) * 100);

  return (
    <Card>
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
              Coverage: {coveragePercentage}% of content is included in the article.
              Click segments to select content. Click again to extend selection.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Original Transcript</h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-2">
                  {segments.map((segment, index) => {
                    const isCovered = isSegmentCovered(segment);
                    const isSelected = selectionStart !== null && 
                      Math.min(selectionStart, index) >= Math.min(selectionStart, index) && 
                      Math.max(selectionStart, index) <= Math.max(selectionStart, index);

                    return (
                      <div
                        key={index}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          isSelected || selectedText.includes(segment) ? "bg-accent" : ""
                        } ${
                          isCovered ? "text-muted-foreground" : "text-red-600 hover:bg-red-100/10"
                        }`}
                        onClick={() => handleSegmentClick(index)}
                      >
                        {segment}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Generated Article</h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="whitespace-pre-wrap">{article}</div>
              </ScrollArea>
            </div>
          </div>

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