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

  // Split transcript into semantic sections
  const paragraphs = transcript.split(/[.!?]\s+(?=[A-Z])/).filter(p => p.trim().length > 0);

  // Enhanced coverage detection algorithm
  const isParagraphCovered = useCallback((paragraph: string) => {
    if (!paragraph.trim()) return true;

    const dmp = new DiffMatchPatch();
    const words = paragraph.toLowerCase().split(/\s+/);
    const articleLower = article.toLowerCase();

    // Use more sophisticated coverage detection:
    // 1. Check for exact phrases (3+ words)
    // 2. Look for key sentence structures
    // 3. Consider semantic similarity through key terms

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

    // Consider a paragraph covered if it has matching phrases or high word coverage
    return hasMatchingPhrases || wordCoverageRatio > 0.75;
  }, [article]);

  const handleParagraphClick = (paragraph: string) => {
    // Expand selection to include context
    const paragraphIndex = paragraphs.indexOf(paragraph);

    // Get surrounding context (one paragraph before and after)
    const context = paragraphs
      .slice(Math.max(0, paragraphIndex - 1), Math.min(paragraphs.length, paragraphIndex + 2))
      .join('\n\n');

    setSelectedText(context);
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

  // Calculate coverage statistics
  const totalParagraphs = paragraphs.length;
  const coveredParagraphs = paragraphs.filter(isParagraphCovered).length;
  const coveragePercentage = Math.round((coveredParagraphs / totalParagraphs) * 100);

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
              Click on any red section to add missing content.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Original Transcript</h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-4">
                  {paragraphs.map((paragraph, index) => {
                    const isCovered = isParagraphCovered(paragraph);
                    return (
                      <div
                        key={index}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedText.includes(paragraph) ? "bg-accent" : ""
                        } ${
                          isCovered ? "text-muted-foreground" : "text-red-600 hover:bg-red-100/10"
                        }`}
                        onClick={() => handleParagraphClick(paragraph)}
                      >
                        {paragraph}
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
              <h4 className="font-semibold mb-2">Selected Content (with Context)</h4>
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