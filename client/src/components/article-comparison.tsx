import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
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

  // Split transcript into individual sentences with improved sentence detection
  const sentences = transcript
    .split(/([.!?]+[\s\n]+)/)
    .reduce((acc: string[], part, i, arr) => {
      if (i % 2 === 0 && arr[i + 1]) {
        acc.push(part + arr[i + 1]);
      }
      return acc;
    }, [])
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());

  // Strict content coverage detection
  const isSentenceCovered = (sentence: string) => {
    if (!sentence.trim()) return true;

    const dmp = new DiffMatchPatch();
    const sentenceLower = sentence.toLowerCase().trim();
    const articleLower = article.toLowerCase();

    // 1. Extract meaningful phrases (4+ words)
    const words = sentenceLower.split(/\s+/);
    const keyPhrases = words
      .slice(0, -3) // Look for 4-word phrases
      .map((_, i) => words.slice(i, i + 4).join(' '))
      .filter(phrase => phrase.split(/\s+/).length >= 4);

    // 2. Check for exact phrase matches
    const hasExactPhraseMatch = keyPhrases.some(phrase => 
      articleLower.includes(phrase)
    );

    // 3. Check for semantic content coverage
    const significantWords = words.filter(w => 
      w.length > 3 && 
      !['than', 'that', 'this', 'with', 'from', 'have', 'were', 'what'].includes(w)
    );

    const coveredWords = significantWords.filter(word => {
      // Look for exact word matches or close variations
      return articleLower.includes(` ${word} `) || 
             articleLower.includes(`${word}.`) ||
             articleLower.includes(`${word},`);
    });

    // Calculate similarity ratio
    const similarityRatio = coveredWords.length / significantWords.length;

    // Sentence is considered covered if it has exact phrase matches
    // AND high word coverage (90%+ of significant words)
    return hasExactPhraseMatch && similarityRatio > 0.9;
  };

  const handleSentenceClick = (sentence: string) => {
    setSelectedText(sentence);
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
  const totalSentences = sentences.length;
  const coveredSentences = sentences.filter(isSentenceCovered).length;
  const coveragePercentage = Math.round((coveredSentences / totalSentences) * 100);

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
              Click any red sentence to add it to the article.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Original Transcript</h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-1">
                  {sentences.map((sentence, index) => {
                    const isCovered = isSentenceCovered(sentence);
                    return (
                      <div
                        key={index}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedText === sentence ? "bg-accent" : ""
                        } ${
                          isCovered ? "text-muted-foreground" : "text-red-600 hover:bg-red-100/10"
                        }`}
                        onClick={() => !isCovered && handleSentenceClick(sentence)}
                      >
                        {sentence}
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
              <h4 className="font-semibold mb-2">Selected Sentence</h4>
              <p className="mb-4">{selectedText}</p>
              <Button 
                onClick={handleAddSection} 
                disabled={isAdding}
              >
                {isAdding ? "Adding to Article..." : "Add Selected Sentence"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}